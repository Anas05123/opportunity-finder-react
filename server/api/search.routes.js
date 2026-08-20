import express from 'express';
import db from '../db/sqliteClient.js';
import { compileSearchConstraints } from '../services/constraintCompiler.js';
import { discoverOpportunities } from '../services/discoveryOrchestrator.js';
import { processConversationalQuery } from '../services/conversationalSearch.js';

const router = express.Router();

/**
 * 1. POST /api/v3/search/intent
 * Natural Language to Compiled AST Constraint Predicates
 */
router.post('/intent', async (req, res) => {
  try {
    const { raw_query, user_profile } = req.body;
    if (!raw_query || !raw_query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const compiled = compileSearchConstraints(raw_query, user_profile);
    const nluResult = await processConversationalQuery({ query: raw_query, userProfile: user_profile });

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
router.post('/execute', async (req, res) => {
  try {
    const { query, compiled_constraints, user_profile, debug } = req.body;
    const effectiveQuery = query || compiled_constraints?.raw_query || 'internship';
    const effectiveConstraints = compiled_constraints || compileSearchConstraints(effectiveQuery, user_profile);

    console.log(`[Search V4 Router] Invoking Discovery Orchestrator for: "${effectiveQuery}"`);

    const discoveryResult = await discoverOpportunities({
      query: effectiveQuery,
      userProfile: user_profile || {},
      compiledConstraints: effectiveConstraints,
      debug: Boolean(debug)
    });

    // Build relaxation options when 0 results returned
    const relaxationOptions = [];
    if (discoveryResult.results.length === 0) {
      if (effectiveConstraints.predicates?.location?.mode === 'STRICT_CITY_ONLY') {
        relaxationOptions.push({
          id: 'relax_location',
          type: 'location',
          label: `Expand search to Greater ${effectiveConstraints.predicates.location.target_city || 'Klang Valley'} Metro Area`
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

/**
 * 3. GET /api/v3/opportunities/:id/evidence
 * Fetch complete verbatim evidence audit log for a specific opportunity
 */
router.get('/opportunities/:id/evidence', (req, res) => {
  try {
    const { id } = req.params;
    const evidence = db.prepare(`
      SELECT * FROM opportunity_evidence WHERE opportunity_id = ?
    `).all(id);

    const snapshots = db.prepare(`
      SELECT * FROM opportunity_snapshots WHERE opportunity_id = ? ORDER BY snapshot_timestamp DESC LIMIT 10
    `).all(id);

    res.json({
      status: 'success',
      opportunity_id: id,
      evidence_count: evidence.length,
      evidence,
      snapshots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy backward-compatibility routes
router.post('/conversational', async (req, res) => {
  const { query, userProfile, previousAnswers } = req.body;
  const conversationResult = await processConversationalQuery({
    query,
    userProfile,
    previousAnswers: previousAnswers || {}
  });
  res.json({ status: 'success', ...conversationResult });
});

export default router;
