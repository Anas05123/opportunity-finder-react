/**
 * CAREERLY ADMIN SECURITY CENTER API (PHASE 5A)
 * Exposes read-only administrative visibility into:
 * - Real-time security posture and authoritative deterministic scores
 * - Latest and historical security audit runs
 * - Itemized check assertions and category breakdown
 * - Runtime security defense events and telemetry stats
 * - Subsystem operational health
 * 
 * STRICT ACCESS CONTROL: All routes require valid JWT authentication + Admin role.
 */

import express from 'express';
import db from '../db/sqliteClient.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  SCORING_POLICY, 
  calculateSecurityScore, 
  normalizeCategoryName 
} from '../services/securityScoreEngine.js';
import { 
  EVENT_SEVERITIES, 
  sanitizeSecurityDetails 
} from '../services/security/securityEvents.js';
import { runDependencyAudit } from '../services/security/dependencyScanner.js';
import { runSecretScan } from '../services/security/secretScanner.js';
import { runBundleSecretScan } from '../services/security/bundleScanner.js';
import { executeSupplyChainAudit, getLatestSupplyChainArtifact } from '../services/security/supplyChainService.js';
import { scanGitHistory, generateGitHistoryArtifact } from '../services/security/gitHistoryScanner.js';
import { executeSecurityAudit } from '../services/securityAuditRunner.js';
import { 
  getAlertingConfigStatus, 
  triggerTestAlert, 
  ALERT_POLICY 
} from '../services/security/securityAlerts.js';

const router = express.Router();

// Enforce Authentication and Admin Privileges on all Security Center routes
router.use(authenticateToken, requireAdmin);

const ALLOWED_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']);
const ALLOWED_CHECK_STATUSES = new Set(['PASS', 'FAIL', 'WARNING', 'NOT_RUN']);
const ALLOWED_AUDIT_STATUSES = new Set(['HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'NOT_VERIFIED', 'SECURITY_VERIFICATION_OUTDATED', 'IN_PROGRESS', 'PASSED', 'FAILED']);

/**
 * Helper to safely parse and clamp pagination integers
 */
function parsePagination(query, defaultLimit = 20, maxLimit = 50) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * 1. GET /api/v1/admin/security/status
 * Returns current deterministic security status, authoritative score, and freshness.
 */
router.get('/status', (req, res) => {
  try {
    const latestRun = db.prepare(`
      SELECT * FROM security_audit_runs 
      WHERE status != 'IN_PROGRESS' 
      ORDER BY completed_at DESC, rowid DESC 
      LIMIT 1
    `).get();

    if (!latestRun) {
      return res.json({
        status: 'NOT_VERIFIED',
        score: null,
        lastAudit: null,
        freshness: {
          isOutdated: true,
          ttlHours: SCORING_POLICY.defaultTtlHours
        },
        message: 'No security audits have been completed yet. Run a baseline audit to establish posture.'
      });
    }

    // Fetch checks for latest run to derive live score & status deterministically
    const checks = db.prepare(`
      SELECT id, run_id, check_key, category, name, severity, status, evidence_text, error_message 
      FROM security_checks 
      WHERE run_id = ?
    `).all(latestRun.id);

    const scoreResult = calculateSecurityScore(checks, {
      completedAt: latestRun.completed_at || latestRun.started_at,
      ttlHours: SCORING_POLICY.defaultTtlHours
    });

    res.json({
      status: scoreResult.status,
      score: scoreResult.score,
      lastAudit: {
        id: latestRun.id,
        status: latestRun.status,
        score: latestRun.score !== null ? latestRun.score : scoreResult.score,
        totalChecks: latestRun.total_checks,
        passedChecks: latestRun.passed_checks,
        failedChecks: latestRun.failed_checks,
        warningChecks: latestRun.warning_checks,
        completedAt: latestRun.completed_at,
        durationMs: latestRun.duration_ms,
        gitCommit: latestRun.git_commit,
        appVersion: latestRun.app_version
      },
      freshness: {
        isOutdated: scoreResult.is_outdated,
        ttlHours: scoreResult.ttl_hours,
        evaluatedAt: scoreResult.evaluated_at
      },
      criticalFailuresCount: scoreResult.critical_failures ? scoreResult.critical_failures.length : 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security status', code: 'SECURITY_STATUS_ERROR' });
  }
});

/**
 * 2. GET /api/v1/admin/security/latest
 * Returns the most recent completed security audit with sanitized metadata.
 */
router.get('/latest', (req, res) => {
  try {
    const latestRun = db.prepare(`
      SELECT * FROM security_audit_runs 
      WHERE status != 'IN_PROGRESS' 
      ORDER BY completed_at DESC, rowid DESC 
      LIMIT 1
    `).get();

    if (!latestRun) {
      return res.status(404).json({ error: 'No completed security audits found', code: 'NO_AUDITS_FOUND' });
    }

    let parsedMetadata = {};
    try {
      parsedMetadata = sanitizeSecurityDetails(JSON.parse(latestRun.metadata_json || '{}'));
    } catch (e) {
      parsedMetadata = {};
    }

    res.json({
      audit: {
        id: latestRun.id,
        suite_version: latestRun.suite_version,
        app_version: latestRun.app_version,
        git_commit: latestRun.git_commit,
        triggered_by: latestRun.triggered_by,
        total_checks: latestRun.total_checks,
        passed_checks: latestRun.passed_checks,
        failed_checks: latestRun.failed_checks,
        warning_checks: latestRun.warning_checks,
        score: latestRun.score,
        status: latestRun.status,
        duration_ms: latestRun.duration_ms,
        started_at: latestRun.started_at,
        completed_at: latestRun.completed_at,
        metadata: parsedMetadata
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve latest audit', code: 'LATEST_AUDIT_ERROR' });
  }
});

/**
 * 3. GET /api/v1/admin/security/audits
 * Paginated historical audit runs with deterministic ordering.
 */
router.get('/audits', (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 10, 50);

    const totalCountRow = db.prepare('SELECT COUNT(*) as count FROM security_audit_runs').get();
    const total = totalCountRow ? totalCountRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const audits = db.prepare(`
      SELECT id, suite_version, app_version, git_commit, triggered_by,
             total_checks, passed_checks, failed_checks, warning_checks,
             score, status, duration_ms, started_at, completed_at
      FROM security_audit_runs
      ORDER BY started_at DESC, rowid DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      total,
      page,
      limit,
      totalPages,
      audits
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit history', code: 'AUDITS_QUERY_ERROR' });
  }
});

/**
 * 4. GET /api/v1/admin/security/audits/:id
 * Returns single audit details, associated checks, and category score breakdown.
 */
router.get('/audits/:id', (req, res) => {
  try {
    const auditId = String(req.params.id || '').trim();
    if (!auditId || auditId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(auditId)) {
      return res.status(400).json({ error: 'Invalid audit identifier format', code: 'INVALID_AUDIT_ID' });
    }

    const audit = db.prepare(`
      SELECT * FROM security_audit_runs WHERE id = ?
    `).get(auditId);

    if (!audit) {
      return res.status(404).json({ error: 'Security audit run not found', code: 'AUDIT_NOT_FOUND' });
    }

    const checks = db.prepare(`
      SELECT id, check_key, category, name, description, severity, status, execution_time_ms, evidence_text, error_message, created_at
      FROM security_checks
      WHERE run_id = ?
      ORDER BY category ASC, severity DESC, name ASC
    `).all(auditId);

    const scoreResult = calculateSecurityScore(checks, {
      completedAt: audit.completed_at || audit.started_at,
      ttlHours: SCORING_POLICY.defaultTtlHours
    });

    let sanitizedMetadata = {};
    try {
      sanitizedMetadata = sanitizeSecurityDetails(JSON.parse(audit.metadata_json || '{}'));
    } catch (e) {
      sanitizedMetadata = {};
    }

    res.json({
      audit: {
        id: audit.id,
        suite_version: audit.suite_version,
        app_version: audit.app_version,
        git_commit: audit.git_commit,
        triggered_by: audit.triggered_by,
        total_checks: audit.total_checks,
        passed_checks: audit.passed_checks,
        failed_checks: audit.failed_checks,
        warning_checks: audit.warning_checks,
        score: audit.score !== null ? audit.score : scoreResult.score,
        status: audit.status,
        duration_ms: audit.duration_ms,
        started_at: audit.started_at,
        completed_at: audit.completed_at,
        metadata: sanitizedMetadata
      },
      score_breakdown: scoreResult,
      checks_count: checks.length,
      checks
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit details', code: 'AUDIT_DETAILS_ERROR' });
  }
});

/**
 * 5. GET /api/v1/admin/security/checks
 * Returns security checks with allow-listed filtering & pagination.
 */
router.get('/checks', (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 20, 100);
    const { category, severity, status, run_id } = req.query;

    const whereClauses = [];
    const params = [];

    if (run_id) {
      const cleanRunId = String(run_id).trim();
      if (!/^[a-zA-Z0-9_-]+$/.test(cleanRunId)) {
        return res.status(400).json({ error: 'Invalid run_id filter format', code: 'INVALID_FILTER' });
      }
      whereClauses.push('run_id = ?');
      params.push(cleanRunId);
    }

    if (category) {
      const cleanCategory = String(category).trim().slice(0, 50);
      whereClauses.push('LOWER(category) = LOWER(?)');
      params.push(cleanCategory);
    }

    if (severity) {
      const cleanSeverity = String(severity).trim().toUpperCase();
      if (!ALLOWED_SEVERITIES.has(cleanSeverity)) {
        return res.status(400).json({ error: `Invalid severity filter. Allowed: ${Array.from(ALLOWED_SEVERITIES).join(', ')}`, code: 'INVALID_SEVERITY_FILTER' });
      }
      whereClauses.push('severity = ?');
      params.push(cleanSeverity);
    }

    if (status) {
      const cleanStatus = String(status).trim().toUpperCase();
      if (!ALLOWED_CHECK_STATUSES.has(cleanStatus)) {
        return res.status(400).json({ error: `Invalid status filter. Allowed: ${Array.from(ALLOWED_CHECK_STATUSES).join(', ')}`, code: 'INVALID_STATUS_FILTER' });
      }
      whereClauses.push('status = ?');
      params.push(cleanStatus);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM security_checks ${whereSql}`;
    const totalCountRow = db.prepare(countSql).get(...params);
    const total = totalCountRow ? totalCountRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const dataSql = `
      SELECT id, run_id, check_key, category, name, description, severity, status, execution_time_ms, evidence_text, error_message, created_at
      FROM security_checks
      ${whereSql}
      ORDER BY created_at DESC, rowid DESC
      LIMIT ? OFFSET ?
    `;
    const checks = db.prepare(dataSql).all(...params, limit, offset);

    res.json({
      total,
      page,
      limit,
      totalPages,
      checks
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query security checks', code: 'CHECKS_QUERY_ERROR' });
  }
});

/**
 * 6. GET /api/v1/admin/security/events
 * Returns security events with allow-listed filtering, pagination, and defense-in-depth sanitization.
 */
router.get('/events', (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 20, 100);
    const { event_type, severity, actor_user_id, from_date, to_date } = req.query;

    const whereClauses = [];
    const params = [];

    if (event_type) {
      const cleanType = String(event_type).trim().toUpperCase();
      if (!EVENT_SEVERITIES[cleanType]) {
        return res.status(400).json({ error: 'Invalid event_type filter', code: 'INVALID_EVENT_TYPE_FILTER' });
      }
      whereClauses.push('event_type = ?');
      params.push(cleanType);
    }

    if (severity) {
      const cleanSev = String(severity).trim().toUpperCase();
      if (!ALLOWED_SEVERITIES.has(cleanSev)) {
        return res.status(400).json({ error: 'Invalid severity filter', code: 'INVALID_SEVERITY_FILTER' });
      }
      whereClauses.push('severity = ?');
      params.push(cleanSev);
    }

    if (actor_user_id) {
      const cleanUserId = String(actor_user_id).trim().slice(0, 64);
      whereClauses.push('actor_user_id = ?');
      params.push(cleanUserId);
    }

    if (from_date) {
      const fromTime = new Date(from_date);
      if (isNaN(fromTime.getTime())) {
        return res.status(400).json({ error: 'Invalid from_date ISO format', code: 'INVALID_DATE_FILTER' });
      }
      whereClauses.push('created_at >= ?');
      params.push(fromTime.toISOString());
    }

    if (to_date) {
      const toTime = new Date(to_date);
      if (isNaN(toTime.getTime())) {
        return res.status(400).json({ error: 'Invalid to_date ISO format', code: 'INVALID_DATE_FILTER' });
      }
      whereClauses.push('created_at <= ?');
      params.push(toTime.toISOString());
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as count FROM security_events ${whereSql}`;
    const totalCountRow = db.prepare(countSql).get(...params);
    const total = totalCountRow ? totalCountRow.count : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const dataSql = `
      SELECT id, event_type, severity, actor_user_id, actor_ip, actor_email_hash, request_path, request_method, details_json, created_at
      FROM security_events
      ${whereSql}
      ORDER BY created_at DESC, rowid DESC
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(dataSql).all(...params, limit, offset);

    // Defense-in-depth output privacy pass
    const sanitizedEvents = rows.map(r => {
      let details = {};
      try {
        details = sanitizeSecurityDetails(JSON.parse(r.details_json || '{}'));
      } catch (e) {
        details = {};
      }
      return {
        id: r.id,
        event_type: r.event_type,
        severity: r.severity,
        actor_user_id: r.actor_user_id,
        actor_ip: r.actor_ip,
        actor_email_hash: r.actor_email_hash,
        request_path: r.request_path,
        request_method: r.request_method,
        details,
        created_at: r.created_at
      };
    });

    res.json({
      total,
      page,
      limit,
      totalPages,
      events: sanitizedEvents
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query security events', code: 'EVENTS_QUERY_ERROR' });
  }
});

/**
 * 7. GET /api/v1/admin/security/events/stats
 * Database-derived aggregated telemetry statistics.
 */
router.get('/events/stats', (req, res) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM security_events').get();
    const total = totalRow ? totalRow.count : 0;

    const last24hRow = db.prepare(`
      SELECT COUNT(*) as count FROM security_events 
      WHERE created_at >= datetime('now', '-24 hours')
    `).get();
    const last24h = last24hRow ? last24hRow.count : 0;

    // Severity breakdown
    const severityRows = db.prepare(`
      SELECT severity, COUNT(*) as count 
      FROM security_events 
      GROUP BY severity
    `).all();

    const bySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFORMATIONAL: 0
    };
    for (const row of severityRows) {
      if (bySeverity[row.severity] !== undefined) {
        bySeverity[row.severity] = row.count;
      }
    }

    // Event type breakdown
    const typeRows = db.prepare(`
      SELECT event_type, COUNT(*) as count 
      FROM security_events 
      GROUP BY event_type
      ORDER BY count DESC
    `).all();

    const byType = {};
    for (const row of typeRows) {
      byType[row.event_type] = row.count;
    }

    res.json({
      total,
      last24h,
      bySeverity,
      byType
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate security event statistics', code: 'EVENT_STATS_ERROR' });
  }
});

/**
 * 8. GET /api/v1/admin/security/categories
 * Authoritative category breakdown from securityScoreEngine.js.
 */
router.get('/categories', (req, res) => {
  try {
    const latestRun = db.prepare(`
      SELECT id, completed_at, started_at FROM security_audit_runs 
      WHERE status != 'IN_PROGRESS' 
      ORDER BY completed_at DESC, rowid DESC 
      LIMIT 1
    `).get();

    let checks = [];
    if (latestRun) {
      checks = db.prepare(`
        SELECT id, check_key, category, name, severity, status, error_message, evidence_text
        FROM security_checks
        WHERE run_id = ?
      `).all(latestRun.id);
    }

    const scoreResult = calculateSecurityScore(checks, {
      completedAt: latestRun ? (latestRun.completed_at || latestRun.started_at) : new Date(0),
      ttlHours: SCORING_POLICY.defaultTtlHours
    });

    const categoryList = Object.entries(scoreResult.category_scores || {}).map(([key, data]) => ({
      key,
      name: SCORING_POLICY.categories[key]?.name || key,
      weight: data.max_score,
      score: data.score,
      percentage: data.percentage,
      status: data.status,
      checks_count: data.checks_count,
      passed_count: data.passed_count,
      failed_count: data.failed_count,
      warning_count: data.warning_count,
      not_run_count: data.not_run_count
    }));

    res.json({
      scoring_policy: {
        total_max_points: 100,
        thresholds: SCORING_POLICY.thresholds,
        default_ttl_hours: SCORING_POLICY.defaultTtlHours
      },
      overall_score: scoreResult.score,
      overall_status: scoreResult.status,
      is_outdated: scoreResult.is_outdated,
      categories: categoryList,
      category_scores: scoreResult.category_scores
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute category breakdown', code: 'CATEGORIES_QUERY_ERROR' });
  }
});

/**
 * 9. GET /api/v1/admin/security/health
 * Operational security system health check.
 */
router.get('/health', (req, res) => {
  try {
    // 1. Check database connectivity
    const ping = db.prepare('SELECT 1 as alive').get();
    const dbAlive = ping && ping.alive === 1;

    // 2. Check security tables presence
    const tables = ['security_audit_runs', 'security_checks', 'security_events'];
    const tableStatus = {};
    for (const t of tables) {
      const exists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name=?
      `).get(t);
      tableStatus[t] = Boolean(exists);
    }

    // 3. Check latest audit presence & freshness
    const latestRun = db.prepare(`
      SELECT id, score, status, completed_at, started_at 
      FROM security_audit_runs 
      WHERE status != 'IN_PROGRESS' 
      ORDER BY completed_at DESC, rowid DESC 
      LIMIT 1
    `).get();

    let auditFreshness = 'NO_AUDITS';
    let isFresh = false;
    if (latestRun) {
      const completedAt = new Date(latestRun.completed_at || latestRun.started_at);
      const ageHours = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60);
      isFresh = ageHours <= SCORING_POLICY.defaultTtlHours;
      auditFreshness = isFresh ? 'FRESH' : 'OUTDATED';
    }

    const allTablesPresent = Object.values(tableStatus).every(Boolean);
    const isHealthy = dbAlive && allTablesPresent;

    res.json({
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      database: dbAlive ? 'connected' : 'disconnected',
      tables: tableStatus,
      latestAuditAvailable: Boolean(latestRun),
      auditFreshness,
      isFresh,
      checkedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'CRITICAL', 
      error: 'Security subsystem health check failed', 
      code: 'HEALTH_CHECK_FAILED' 
    });
  }
});
/**
 * 10. POST /api/v1/admin/security/audit/run & /audits/run
 * Triggers full 35-point enterprise security audit suite on-demand.
 */
router.post(['/audit/run', '/audits/run'], async (req, res) => {
  try {
    const result = await executeSecurityAudit({
      triggeredBy: req.user?.email || 'admin_operator',
      actor_ip: req.ip || '127.0.0.1'
    });
    res.json({
      success: true,
      status: 'success',
      message: '35-Point Security Audit completed successfully',
      data: result
    });
  } catch (err) {
    console.error('[Security Routes] Audit run execution error:', err);
    res.status(500).json({
      success: false,
      error: 'Security audit execution failed: ' + err.message,
      code: 'AUDIT_EXECUTION_ERROR'
    });
  }
});

/**
 * 11. POST /api/v1/admin/security/scan/dependencies
 * Trigger a deterministic supply-chain dependency audit
 */
router.post('/scan/dependencies', async (req, res) => {
  try {
    const result = await runDependencyAudit();
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Dependency scan execution failed',
      details: err.message
    });
  }
});

/**
 * 12. POST /api/v1/admin/security/scan/secrets
 * Trigger high-confidence secret and frontend bundle leak scan
 */
router.post('/scan/secrets', (req, res) => {
  try {
    const sourceScan = runSecretScan();
    const bundleScan = runBundleSecretScan();
    res.json({
      success: true,
      data: {
        sourceScan,
        bundleScan
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Secret scan execution failed',
      details: err.message
    });
  }
});

/**
 * 13. GET /api/v1/admin/security/supply-chain
 * Fetch the latest supply-chain and secret audit artifact
 */
router.get('/supply-chain', async (req, res) => {
  try {
    let artifact = getLatestSupplyChainArtifact();
    if (!artifact) {
      artifact = await executeSupplyChainAudit();
    }
    res.json({
      success: true,
      data: artifact
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve supply chain artifact',
      details: err.message
    });
  }
});

/**
 * 15. POST /api/v1/admin/security/scan/git-history
 * Trigger historical Git secret scan across all reachable commits
 */
router.post('/scan/git-history', async (req, res) => {
  try {
    const report = await generateGitHistoryArtifact();
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Git history scan failed',
      details: err.message
    });
  }
});

/**
 * 16. GET /api/v1/admin/security/git-history
 * Retrieve latest git history scan results
 */
router.get('/git-history', async (req, res) => {
  try {
    const report = scanGitHistory();
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve git history scan results',
      details: err.message
    });
  }
});

/**
 * 17. GET /api/v1/admin/security/alerts
 * Paginated list of security alerts with allowlisted filters.
 */
router.get('/alerts', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { severity, alert_type, status } = req.query;

    const conditions = [];
    const params = [];

    if (severity) {
      if (!ALLOWED_SEVERITIES.has(severity.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid severity filter', code: 'INVALID_SEVERITY' });
      }
      conditions.push('severity = ?');
      params.push(severity.toUpperCase());
    }

    if (status) {
      const allowedStatuses = new Set(['TRIGGERED', 'DELIVERED', 'FAILED', 'SUPPRESSED', 'RESOLVED']);
      if (!allowedStatuses.has(status.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid status filter', code: 'INVALID_STATUS' });
      }
      conditions.push('status = ?');
      params.push(status.toUpperCase());
    }

    if (alert_type) {
      conditions.push('alert_type = ?');
      params.push(alert_type.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM security_alerts ${whereClause}`).get(...params);
    const total = totalRow ? totalRow.count : 0;

    const alerts = db.prepare(`
      SELECT id, alert_type, severity, title, summary, source, status, fingerprint, details_json, created_at
      FROM security_alerts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const formattedAlerts = alerts.map(a => {
      let details = {};
      try {
        details = JSON.parse(a.details_json || '{}');
      } catch (e) {}
      return {
        ...a,
        details: sanitizeSecurityDetails(details)
      };
    });

    res.json({
      alerts: formattedAlerts,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve security alerts', code: 'ALERTS_QUERY_ERROR' });
  }
});

/**
 * 18. GET /api/v1/admin/security/alerts/stats
 * Aggregated statistics and operational metrics on triggered alerts.
 */
router.get('/alerts/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM security_alerts').get()?.count || 0;
    const last24h = db.prepare(`
      SELECT COUNT(*) as count FROM security_alerts
      WHERE created_at >= datetime('now', '-24 hours')
    `).get()?.count || 0;

    const bySeverityRows = db.prepare(`
      SELECT severity, COUNT(*) as count 
      FROM security_alerts 
      GROUP BY severity
    `).all();
    const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFORMATIONAL: 0 };
    for (const r of bySeverityRows) {
      if (bySeverity[r.severity] !== undefined) bySeverity[r.severity] = r.count;
    }

    const byTypeRows = db.prepare(`
      SELECT alert_type, COUNT(*) as count 
      FROM security_alerts 
      GROUP BY alert_type 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    const byType = {};
    for (const r of byTypeRows) {
      byType[r.alert_type] = r.count;
    }

    const deliveryTotal = db.prepare('SELECT COUNT(*) as count FROM security_alert_deliveries').get()?.count || 0;
    const deliverySuccess = db.prepare("SELECT COUNT(*) as count FROM security_alert_deliveries WHERE status = 'SUCCESS'").get()?.count || 0;

    res.json({
      total_alerts: total,
      last_24h_alerts: last24h,
      by_severity: bySeverity,
      by_type: byType,
      deliveries: {
        total: deliveryTotal,
        successful: deliverySuccess,
        success_rate: deliveryTotal > 0 ? Number(((deliverySuccess / deliveryTotal) * 100).toFixed(1)) : 100
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate alert statistics', code: 'ALERT_STATS_ERROR' });
  }
});

/**
 * 19. GET /api/v1/admin/security/alerts/config
 * Returns active notification channel configuration status without leaking sensitive values.
 */
router.get('/alerts/config', (req, res) => {
  try {
    const config = getAlertingConfigStatus();
    res.json({
      channels: config,
      policy: ALERT_POLICY
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve alert configuration', code: 'ALERT_CONFIG_ERROR' });
  }
});

/**
 * 20. POST /api/v1/admin/security/alerts/test
 * Triggers an authorized administrative test alert to verify notification channels.
 */
router.post('/alerts/test', async (req, res) => {
  try {
    const result = await triggerTestAlert(req.user?.id || 'admin');
    res.json({
      success: true,
      message: 'Test notification triggered successfully',
      result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Test notification dispatch failed',
      details: err.message
    });
  }
});

/**
 * 21. GET /api/v1/admin/security/alerts/:id
 * Retrieve a specific alert with its delivery attempts.
 */
router.get('/alerts/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid alert ID format', code: 'INVALID_ALERT_ID' });
    }

    const alert = db.prepare(`
      SELECT id, alert_type, severity, title, summary, source, status, fingerprint, details_json, created_at
      FROM security_alerts
      WHERE id = ?
    `).get(id);

    if (!alert) {
      return res.status(404).json({ error: 'Security alert not found', code: 'ALERT_NOT_FOUND' });
    }

    const deliveries = db.prepare(`
      SELECT id, channel, status, error_message, duration_ms, attempt_count, delivered_at
      FROM security_alert_deliveries
      WHERE alert_id = ?
      ORDER BY delivered_at ASC
    `).all(id);

    let details = {};
    try {
      details = JSON.parse(alert.details_json || '{}');
    } catch (e) {}

    res.json({
      ...alert,
      details: sanitizeSecurityDetails(details),
      deliveries
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve alert record', code: 'ALERT_LOOKUP_ERROR' });
  }
});

export default router;

