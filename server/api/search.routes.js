import express from 'express';
import crypto from 'crypto';
import db from '../db/sqliteClient.js';
import { compileSearchConstraints } from '../services/constraintCompiler.js';
import { discoverOpportunities } from '../services/discoveryOrchestrator.js';
import { processConversationalQuery } from '../services/conversationalSearch.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * 1. POST /api/v3/search/intent
 * Natural Language to Compiled AST Constraint Predicates
 */
router.post('/intent', optionalAuth, async (req, res) => {
  try {
    const { raw_query, user_profile } = req.body;
    if (!raw_query || !raw_query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const effectiveProfile = user_profile || req.careerProfile || {};
    const compiled = compileSearchConstraints(raw_query, effectiveProfile);
    const nluResult = await processConversationalQuery({ query: raw_query, userProfile: effectiveProfile });

    res.json({
      status: 'ready',
      has_enough_info: nluResult.hasEnoughInfo ?? true,
      compiled_constraints: compiled,
      follow_up_question: nluResult.followUpQuestion || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. POST /api/v3/search/execute
 * Live Opportunity Discovery Orchestration:
 * SearchProfile -> Query Expansion -> Parallel Discovery -> Normalization -> Verification -> Deduplication -> Hard Filter -> Matching -> Ranking
 */
router.post('/execute', optionalAuth, async (req, res) => {
  try {
    const { query, compiled_constraints, user_profile, debug } = req.body;
    const effectiveQuery = query || compiled_constraints?.raw_query || 'internship';
    const effectiveProfile = user_profile || req.careerProfile || {};
    const effectiveConstraints = compiled_constraints || compileSearchConstraints(effectiveQuery, effectiveProfile);

    console.log(`[Search V4 Router] Invoking Discovery Orchestrator for: "${effectiveQuery}"`);

    const discoveryResult = await discoverOpportunities({
      query: effectiveQuery,
      userProfile: effectiveProfile,
      compiledConstraints: effectiveConstraints,
      debug: Boolean(debug)
    });

    // If user is authenticated, log search history
    if (req.user) {
      try {
        db.prepare(`
          INSERT INTO user_searches (id, user_id, query, filters, results_count)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          `search-${crypto.randomUUID().slice(0, 8)}`,
          req.user.id,
          effectiveQuery,
          JSON.stringify(effectiveConstraints.predicates || {}),
          discoveryResult.results.length
        );
      } catch (e) {
        console.warn('Search history logging note:', e.message);
      }
    }

    // Build relaxation options when 0 results returned
    const relaxationOptions = [];
    if (discoveryResult.results.length === 0) {
      if (effectiveConstraints.predicates?.location?.mode === 'STRICT_CITY_ONLY') {
        relaxationOptions.push({
          id: 'relax_location',
          type: 'location',
          label: `Expand search to Greater ${effectiveConstraints.predicates.location.target_city || 'Metro'} Area`
        });
      }
      if (effectiveConstraints.predicates?.compensation?.is_mandatory) {
        relaxationOptions.push({
          id: 'allow_unknown_comp',
          type: 'compensation',
          label: 'Show opportunities where compensation is not disclosed',
          description: '⚠ Compensation may be unpaid. These opportunities will remain clearly labeled Compensation Unknown and will NOT be treated as verified paid opportunities.'
        });
      }
      relaxationOptions.push({
        id: 'expand_types',
        type: 'opportunity_type',
        label: 'Include Graduate Trainee & Fellowship programs'
      });
      relaxationOptions.push({
        id: 'allow_remote',
        type: 'work_mode',
        label: 'Include Verified Global Remote Opportunities'
      });
    }

    res.json({
      status: discoveryResult.status,
      query_summary: effectiveQuery,
      telemetry: discoveryResult.telemetry,
      funnel_metrics: discoveryResult.funnel_metrics,
      relaxation_options: relaxationOptions,
      results: discoveryResult.results,
      debug_diagnostics: debug ? {
        rejections: discoveryResult.telemetry.rejections,
        sample_rejections: discoveryResult.telemetry.sampleRejections
      } : undefined
    });

  } catch (err) {
    console.error('[Search V4 Router Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
