import express from 'express';
import db from '../db/sqliteClient.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { queueScrapeRun, cancelScrapeRun } from '../services/opportunityIntelligence/ingestionOrchestrator.js';
import { getAdapterForSource } from '../services/opportunityIntelligence/sourceRegistry.js';
import { runLifecycleReconciliation } from '../services/opportunityIntelligence/lifecycleManager.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

const router = express.Router();

// Enforce authentication + admin role across all intelligence endpoints
router.use(authenticateToken, requireAdmin);

/**
 * 1. GET /api/v1/admin/opportunity-intelligence/overview
 * Returns executive intelligence metrics
 */
router.get('/overview', (req, res) => {
  try {
    const totalOpps = db.prepare("SELECT COUNT(*) as count FROM opportunities").get()?.count || 0;
    const activeOpps = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE status = 'active'").get()?.count || 0;
    
    const jobsCount = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE opportunity_type = 'job' AND status = 'active'").get()?.count || 0;
    const internshipsCount = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE opportunity_type = 'internship' AND status = 'active'").get()?.count || 0;
    const scholarshipsCount = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE opportunity_type = 'scholarship' AND status = 'active'").get()?.count || 0;
    const fellowshipsCount = db.prepare("SELECT COUNT(*) as count FROM opportunities WHERE opportunity_type = 'fellowship' AND status = 'active'").get()?.count || 0;

    const enabledSources = db.prepare("SELECT COUNT(*) as count FROM sources WHERE enabled = 1").get()?.count || 0;
    const totalSources = db.prepare("SELECT COUNT(*) as count FROM sources").get()?.count || 0;

    const runningRuns = db.prepare("SELECT COUNT(*) as count FROM scrape_runs WHERE status IN ('QUEUED', 'RUNNING')").get()?.count || 0;
    const lastRun = db.prepare("SELECT * FROM scrape_runs WHERE status IN ('COMPLETED', 'PARTIAL') ORDER BY completed_at DESC LIMIT 1").get() || null;

    const sourcesHealth = db.prepare(`
      SELECT health_status, COUNT(*) as count 
      FROM sources 
      GROUP BY health_status
    `).all();

    res.json({
      status: 'success',
      metrics: {
        total_opportunities: totalOpps,
        active_opportunities: activeOpps,
        jobs_count: jobsCount,
        internships_count: internshipsCount,
        scholarships_count: scholarshipsCount,
        fellowships_count: fellowshipsCount,
        enabled_sources: enabledSources,
        total_sources: totalSources,
        running_jobs: runningRuns,
        last_scrape_at: lastRun?.completed_at || lastRun?.started_at || null,
        sources_health: sourcesHealth
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. GET /api/v1/admin/opportunity-intelligence/scrape-runs
 * Paginated list of scrape runs
 */
router.get('/scrape-runs', (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const total = db.prepare("SELECT COUNT(*) as count FROM scrape_runs").get()?.count || 0;
    const runs = db.prepare(`
      SELECT * FROM scrape_runs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      status: 'success',
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      runs: runs.map(r => ({
        ...r,
        configuration: JSON.parse(r.configuration_json || '{}'),
        errors: JSON.parse(r.errors_json || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. GET /api/v1/admin/opportunity-intelligence/scrape-runs/:id
 */
router.get('/scrape-runs/:id', (req, res) => {
  try {
    const run = db.prepare("SELECT * FROM scrape_runs WHERE id = ?").get(req.params.id);
    if (!run) return res.status(404).json({ error: 'Scrape run not found' });

    const rawRecordsCount = db.prepare("SELECT COUNT(*) as count FROM raw_source_records WHERE scrape_run_id = ?").get(req.params.id)?.count || 0;

    res.json({
      status: 'success',
      run: {
        ...run,
        configuration: JSON.parse(run.configuration_json || '{}'),
        errors: JSON.parse(run.errors_json || '[]'),
        raw_records_count: rawRecordsCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. POST /api/v1/admin/opportunity-intelligence/scrape-runs
 * Queues a new background scrape run and returns immediately (202 Accepted)
 */
router.post('/scrape-runs', (req, res) => {
  try {
    const { configuration = {}, job_id = null } = req.body;

    const runId = queueScrapeRun({
      adminId: req.user.id,
      configuration,
      jobId: job_id
    });

    recordSecurityEvent({
      event_type: 'ADMIN_ACTION',
      severity: 'INFORMATIONAL',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { action: 'TRIGGER_SCRAPE_RUN', run_id: runId, configuration }
    });

    res.status(202).json({
      status: 'queued',
      message: 'Scrape run queued and executing in background orchestrator.',
      run_id: runId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to queue scrape run: ' + err.message });
  }
});

/**
 * 5. POST /api/v1/admin/opportunity-intelligence/scrape-runs/:id/cancel
 */
router.post('/scrape-runs/:id/cancel', (req, res) => {
  try {
    cancelScrapeRun(req.params.id);
    res.json({ status: 'success', message: 'Cancellation signal dispatched.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. GET /api/v1/admin/opportunity-intelligence/sources
 */
router.get('/sources', (req, res) => {
  try {
    const sources = db.prepare("SELECT * FROM sources ORDER BY tier ASC, name ASC").all();
    res.json({
      status: 'success',
      total: sources.length,
      sources: sources.map(s => ({
        ...s,
        config: JSON.parse(s.config_json || '{}')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. PUT /api/v1/admin/opportunity-intelligence/sources/:id
 */
router.put('/sources/:id', (req, res) => {
  try {
    const { enabled, tier, rate_limit_ms, trust_score } = req.body;
    const source = db.prepare("SELECT * FROM sources WHERE id = ?").get(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });

    db.prepare(`
      UPDATE sources
      SET enabled = COALESCE(?, enabled),
          tier = COALESCE(?, tier),
          rate_limit_ms = COALESCE(?, rate_limit_ms),
          trust_score = COALESCE(?, trust_score),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      enabled !== undefined ? (enabled ? 1 : 0) : null,
      tier ?? null,
      rate_limit_ms ?? null,
      trust_score ?? null,
      req.params.id
    );

    res.json({ status: 'success', message: 'Source updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. POST /api/v1/admin/opportunity-intelligence/sources/:id/test
 * Dry-run test for single source
 */
router.post('/sources/:id/test', async (req, res) => {
  try {
    const source = db.prepare("SELECT * FROM sources WHERE id = ?").get(req.params.id);
    if (!source) return res.status(404).json({ error: 'Source not found' });

    const adapter = getAdapterForSource(source);
    if (!adapter) return res.status(400).json({ error: 'Adapter not configured for this source' });

    const startTime = Date.now();
    const rawItems = await adapter.parse();
    const duration = Date.now() - startTime;

    res.json({
      status: 'success',
      source_id: source.id,
      source_name: source.name,
      items_found: rawItems.length,
      sample: rawItems.slice(0, 2),
      latency_ms: duration
    });
  } catch (err) {
    res.status(500).json({ error: 'Source test failed: ' + err.message });
  }
});

/**
 * 9. GET /api/v1/admin/opportunity-intelligence/opportunities
 * Comprehensive opportunity table with provenance & search
 */
router.get('/opportunities', (req, res) => {
  try {
    const { search, type, source_id, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = "SELECT * FROM opportunities WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      query += " AND (title LIKE ? OR company LIKE ? OR description LIKE ?)";
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }
    if (type && type !== 'all') {
      query += " AND opportunity_type = ?";
      params.push(type);
    }
    if (source_id && source_id !== 'all') {
      query += " AND source_id = ?";
      params.push(source_id);
    }
    if (status && status !== 'all') {
      query += " AND status = ?";
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params)?.count || 0;

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), offset);

    const rows = db.prepare(query).all(...params);

    res.json({
      status: 'success',
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      opportunities: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 10. GET /api/v1/admin/opportunity-intelligence/opportunities/:id/raw
 * Full Provenance Inspector for Debugging & Verification
 */
router.get('/opportunities/:id/raw', (req, res) => {
  try {
    const opp = db.prepare("SELECT * FROM opportunities WHERE id = ?").get(req.params.id);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    let rawSourceRecord = null;
    if (opp.scrape_run_id && opp.external_id) {
      rawSourceRecord = db.prepare(`
        SELECT * FROM raw_source_records 
        WHERE scrape_run_id = ? AND external_id = ?
        LIMIT 1
      `).get(opp.scrape_run_id, opp.external_id);
    }

    let parsedRawData = {};
    try {
      parsedRawData = JSON.parse(opp.raw_data || '{}');
    } catch (e) {}

    let parsedRawPayload = {};
    if (rawSourceRecord) {
      try {
        parsedRawPayload = JSON.parse(rawSourceRecord.raw_payload || '{}');
      } catch (e) {}
    }

    res.json({
      status: 'success',
      opportunity: opp,
      raw_data: parsedRawData,
      raw_source_record: rawSourceRecord ? {
        ...rawSourceRecord,
        raw_payload: parsedRawPayload,
        validation_errors: JSON.parse(rawSourceRecord.validation_errors_json || '[]')
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 11. POST /api/v1/admin/opportunity-intelligence/lifecycle/reconcile
 */
router.post('/lifecycle/reconcile', (req, res) => {
  try {
    const result = runLifecycleReconciliation();
    res.json({
      status: 'success',
      message: 'Lifecycle reconciliation completed',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 12. CRUD for Scrape Jobs (Saved Configurations & Schedules)
 */
router.get('/jobs', (req, res) => {
  try {
    const jobs = db.prepare("SELECT * FROM scrape_jobs ORDER BY created_at DESC").all();
    res.json({
      status: 'success',
      jobs: jobs.map(j => ({
        ...j,
        roles: JSON.parse(j.roles_json || '[]'),
        keywords: JSON.parse(j.keywords_json || '[]'),
        locations: JSON.parse(j.locations_json || '[]'),
        countries: JSON.parse(j.countries_json || '[]'),
        excluded_keywords: JSON.parse(j.excluded_keywords_json || '[]'),
        selected_sources: JSON.parse(j.selected_sources_json || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', (req, res) => {
  try {
    const {
      name,
      opportunity_type = 'all',
      roles = [],
      keywords = [],
      locations = [],
      countries = [],
      remote_mode = 'any',
      employment_type = 'all',
      excluded_keywords = [],
      selected_sources = [],
      max_records = 500,
      schedule = 'once',
      custom_interval_hours = 24
    } = req.body;

    const id = `job-${Date.now()}`;
    db.prepare(`
      INSERT INTO scrape_jobs (
        id, admin_id, name, opportunity_type, roles_json, keywords_json,
        locations_json, countries_json, remote_mode, employment_type,
        excluded_keywords_json, selected_sources_json, max_records,
        schedule, custom_interval_hours, is_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      req.user.id,
      name || `Scrape Job (${new Date().toLocaleDateString()})`,
      opportunity_type,
      JSON.stringify(roles),
      JSON.stringify(keywords),
      JSON.stringify(locations),
      JSON.stringify(countries),
      remote_mode,
      employment_type,
      JSON.stringify(excluded_keywords),
      JSON.stringify(selected_sources),
      max_records,
      schedule,
      custom_interval_hours
    );

    res.status(201).json({ status: 'success', message: 'Scrape job created', job_id: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
