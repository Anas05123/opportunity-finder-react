import express from 'express';
import crypto from 'crypto';
import db from '../db/sqliteClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

const router = express.Router();

/**
 * 1. GET /api/v1/applications
 * Returns user-owned application CRM items for the authenticated user.
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT a.*, o.title, o.organization, o.company, o.location_country, o.stipend_text, o.deadline_utc, o.official_apply_url, o.contact_email, o.opportunity_type
      FROM applications a
      LEFT JOIN opportunities o ON a.opportunity_id = o.id
      WHERE a.user_id = ?
      ORDER BY a.updated_at DESC
    `).all(req.user.id);

    res.json({
      status: 'success',
      total_count: rows.length,
      applications: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. POST /api/v1/applications (Save / Update Stage)
 * User-isolated insert/update for CRM stages.
 */
router.post('/', authenticateToken, (req, res) => {
  try {
    const { opportunity_id, stage, notes, cover_letter, custom_cv_bullets, interview_date } = req.body;
    if (!opportunity_id) {
      return res.status(400).json({ error: 'opportunity_id is required' });
    }

    const existing = db.prepare('SELECT * FROM applications WHERE user_id = ? AND opportunity_id = ?').get(req.user.id, opportunity_id);
    const appId = existing ? existing.id : `app-${crypto.randomUUID().slice(0, 8)}`;

    if (existing) {
      db.prepare(`
        UPDATE applications 
        SET stage = ?, notes = ?, cover_letter = ?, custom_cv_bullets = ?, interview_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(
        stage || existing.stage,
        notes !== undefined ? notes : existing.notes,
        cover_letter !== undefined ? cover_letter : existing.cover_letter,
        custom_cv_bullets !== undefined ? custom_cv_bullets : existing.custom_cv_bullets,
        interview_date !== undefined ? interview_date : existing.interview_date,
        appId,
        req.user.id
      );
    } else {
      db.prepare(`
        INSERT INTO applications (id, user_id, opportunity_id, stage, notes, cover_letter, custom_cv_bullets, interview_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        appId,
        req.user.id,
        opportunity_id,
        stage || 'saved',
        notes || '',
        cover_letter || '',
        custom_cv_bullets || '',
        interview_date || null
      );
    }

    res.json({
      status: 'success',
      message: `Opportunity updated in CRM stage: ${stage || 'saved'}`,
      application_id: appId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. DELETE /api/v1/applications/:id
 * Strictly verified user-owned deletion.
 */
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const info = db.prepare(`
      DELETE FROM applications 
      WHERE user_id = ? AND (id = ? OR opportunity_id = ?)
    `).run(req.user.id, req.params.id, req.params.id);

    if (info.changes === 0) {
      // Check if target resource belongs to another tenant for IDOR telemetry
      const targetBelongsToOther = db.prepare('SELECT id, user_id FROM applications WHERE id = ? OR opportunity_id = ?').get(req.params.id, req.params.id);
      if (targetBelongsToOther && targetBelongsToOther.user_id !== req.user.id) {
        recordSecurityEvent({
          event_type: 'IDOR_ATTEMPT',
          severity: 'CRITICAL',
          actor_user_id: req.user.id,
          actor_ip: getSafeClientIp(req),
          request_path: req.originalUrl || req.path,
          request_method: req.method,
          details: { target_resource_type: 'application' }
        });
      }

      return res.status(404).json({ error: 'Application record not found or not owned by user.' });
    }

    res.json({ status: 'success', message: 'Application record removed from CRM' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
