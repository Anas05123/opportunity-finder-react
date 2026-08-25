import express from 'express';
import db from '../db/sqliteClient.js';
import { calculateDeterministicMatchScore } from '../services/matchingEngine.js';
import { generateApplicationKit } from '../services/applicationAssistant.js';
import { generateVerifiedJobUrl } from '../services/linkVerifier.js';
import { sanitizeStipendField, decodeHtmlEntities } from '../services/textSanitizer.js';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to sanitize and enrich opportunity record
function enrichOpportunity(opp, userProfile) {
  if (!opp) return opp;
  const verified = generateVerifiedJobUrl(opp);
  const matchData = calculateDeterministicMatchScore(opp, userProfile || {});
  const cleanStipend = sanitizeStipendField(opp.stipend_text || opp.stipend, opp.description || opp.description_text);

  return {
    ...opp,
    title: decodeHtmlEntities(opp.title),
    company: decodeHtmlEntities(opp.company || opp.company_name || opp.organization),
    organization: decodeHtmlEntities(opp.organization || opp.company || opp.company_name),
    stipend_text: cleanStipend,
    official_apply_url: verified.verified_live_url,
    linkedin_search_url: verified.linkedin_search_url,
    link_verification_status: verified.status,
    link_source_type: verified.source_type,
    match_score: matchData.score,
    match_breakdown: matchData.breakdown,
    match_reasons: matchData.matchReasons,
    match_flags: matchData.flags,
    why_matches_you: matchData.whyMatches
  };
}

// 1. GET /api/v1/opportunities
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, type, field } = req.query;
    const userProfile = req.careerProfile || { major: 'Computer Science', gpa: 3.5, degree_level: 'undergrad' };

    let query = `
      SELECT * FROM opportunities 
      WHERE status = 'active'
        AND LOWER(COALESCE(location_country, '')) NOT LIKE '%israel%'
        AND LOWER(COALESCE(location_city, '')) NOT LIKE '%tel aviv%'
        AND LOWER(COALESCE(location_city, '')) NOT LIKE '%jerusalem%'
        AND LOWER(COALESCE(location_raw, '')) NOT LIKE '%israel%'
        AND LOWER(COALESCE(title, '')) NOT LIKE '%israel%'
        AND LOWER(COALESCE(company, '')) NOT LIKE '%israel%'
        AND LOWER(COALESCE(official_apply_url, '')) NOT LIKE '%.il/%'
        AND LOWER(COALESCE(official_apply_url, '')) NOT LIKE '%.il'
        AND LOWER(COALESCE(source_url, '')) NOT LIKE '%.il%'
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND opportunity_type = ?';
      params.push(type);
    }

    if (field && field !== 'all') {
      query += ' AND field_of_study = ?';
      params.push(field);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR location_country LIKE ? OR field_of_study LIKE ?)';
      params.push(term, term, term, term, term);
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
    const offset = Math.max((parseInt(req.query.page, 10) || 1) - 1, 0) * limit;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params);
    const enriched = rows.map(r => enrichOpportunity(r, userProfile));

    // Sort by deterministic match score descending
    enriched.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    res.json({
      status: 'success',
      total_count: enriched.length,
      opportunities: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/v1/opportunities/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const userProfile = req.careerProfile || {};
    res.json({
      status: 'success',
      opportunity: enrichOpportunity(opp, userProfile)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/v1/opportunities/:id/prepare-application (Application Readiness Kit)
router.post('/:id/prepare-application', optionalAuth, async (req, res) => {
  try {
    const opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const userProfile = req.body?.userProfile || req.careerProfile || { full_name: 'Applicant', degree_title: 'Bachelor of Science (BSc)', major: 'Computer Science', gpa: '3.5' };
    const kit = await generateApplicationKit({ opportunity: opp, userProfile });

    res.json({
      status: 'success',
      application_kit: kit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/v1/opportunities/:id/verify (Admin Only)
router.post('/:id/verify', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare(`
      UPDATE opportunities 
      SET verification_status = 'VERIFIED_ACTIVE', verification_level = 5, trust_score = 98, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({ status: 'success', message: 'Opportunity officially verified by administrator.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /api/v1/opportunities/:id (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare("UPDATE opportunities SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    res.json({ status: 'success', message: 'Opportunity archived.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
