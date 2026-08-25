import express from 'express';
import db from '../db/sqliteClient.js';
import { authenticateToken, requireAdmin, revokeAllUserTokens } from '../middleware/auth.js';
import { runScraperPipeline } from '../services/scheduler.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';
import securityRouter from './security.routes.js';
import opportunityIntelligenceRouter from './admin.opportunityIntelligence.routes.js';

const router = express.Router();

// Enforce authentication + administrative authorization across ALL /api/v1/admin routes
router.use(authenticateToken, requireAdmin);

// Mount Security Center & Opportunity Intelligence sub-routers
router.use('/security', securityRouter);
router.use('/opportunity-intelligence', opportunityIntelligenceRouter);

/**
 * 1. POST /api/v1/admin/scrape
 * Triggers backend scraper pipeline and records administrative security telemetry.
 */
router.post('/scrape', async (req, res) => {
  try {
    recordSecurityEvent({
      event_type: 'ADMIN_ACTION',
      severity: 'INFORMATIONAL',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { action: 'TRIGGER_SCRAPER_PIPELINE' }
    });

    const results = await runScraperPipeline();
    res.json({ status: 'success', message: 'Scraper pipeline executed successfully', results });
  } catch (err) {
    res.status(500).json({ error: 'Scraper execution error: ' + err.message });
  }
});

/**
 * 2. GET /api/v1/admin/users
 * Returns list of platform users (without password hashes or sensitive tokens)
 */
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.role, u.is_email_verified, u.is_disabled, u.token_version, 
             u.auth_provider, u.onboarding_completed, u.created_at, u.updated_at,
             cp.full_name, cp.university, cp.field_of_study, cp.profile_completion
      FROM users u
      LEFT JOIN career_profiles cp ON u.id = cp.user_id
      ORDER BY u.created_at DESC
    `).all();

    res.json({
      status: 'success',
      total_count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. POST /api/v1/admin/users/:id/disable
 * Disables or re-enables a user account and immediately invalidates their active sessions.
 */
router.post('/users/:id/disable', (req, res) => {
  try {
    const { id } = req.params;
    const { disable = true } = req.body;

    const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin' && disable) {
      return res.status(400).json({ error: 'Primary administrator account cannot be disabled.' });
    }

    const disabledState = disable ? 1 : 0;
    db.prepare('UPDATE users SET is_disabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(disabledState, id);

    if (disable) {
      revokeAllUserTokens(id);
    }

    recordSecurityEvent({
      event_type: 'ADMIN_ACTION',
      severity: 'HIGH',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { action: disable ? 'DISABLE_USER_ACCOUNT' : 'ENABLE_USER_ACCOUNT', target_user_id: id }
    });

    res.json({
      status: 'success',
      message: `User account ${user.email} ${disable ? 'disabled and sessions revoked' : 're-enabled'}.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. POST /api/v1/admin/users/:id/revoke-sessions
 * Invalidates all active sessions for a target user
 */
router.post('/users/:id/revoke-sessions', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    revokeAllUserTokens(id);

    recordSecurityEvent({
      event_type: 'ADMIN_ACTION',
      severity: 'HIGH',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { action: 'ADMIN_REVOKE_USER_SESSIONS', target_user_id: id }
    });

    res.json({
      status: 'success',
      message: `All active sessions for user ${user.email} have been revoked.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
