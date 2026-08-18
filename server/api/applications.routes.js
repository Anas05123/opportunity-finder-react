import express from 'express';
import sqliteDb from '../db/sqliteClient.js';

const router = express.Router();

// 1. GET /api/v1/applications
router.get('/', (req, res) => {
  try {
    const rows = sqliteDb.prepare(`
      SELECT a.*, o.title, o.organization, o.location_country, o.stipend_text, o.deadline_utc, o.official_apply_url, o.contact_email
      FROM applications a
      LEFT JOIN opportunities o ON a.opportunity_id = o.id
      ORDER BY a.updated_at DESC
    `).all();

    res.json({
      status: 'success',
      total_count: rows.length,
      applications: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/v1/applications (Save / Update Stage)
router.post('/', (req, res) => {
  try {
    const { opportunity_id, stage, notes, cover_letter, custom_cv_bullets, interview_date } = req.body;
    if (!opportunity_id) {
      return res.status(400).json({ error: 'opportunity_id is required' });
    }

    const existing = sqliteDb.prepare('SELECT * FROM applications WHERE opportunity_id = ?').get(opportunity_id);
    const appId = existing ? existing.id : `app-${Math.random().toString(36).substr(2, 9)}`;

    if (existing) {
      sqliteDb.prepare(`
        UPDATE applications 
        SET stage = ?, notes = ?, cover_letter = ?, custom_cv_bullets = ?, interview_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        stage || existing.stage,
        notes !== undefined ? notes : existing.notes,
        cover_letter !== undefined ? cover_letter : existing.cover_letter,
        custom_cv_bullets !== undefined ? custom_cv_bullets : existing.custom_cv_bullets,
        interview_date !== undefined ? interview_date : existing.interview_date,
        appId
      );
    } else {
      sqliteDb.prepare(`
        INSERT INTO applications (id, opportunity_id, stage, notes, cover_letter, custom_cv_bullets, interview_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        appId,
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

// 3. DELETE /api/v1/applications/:id
router.delete('/:id', (req, res) => {
  try {
    sqliteDb.prepare('DELETE FROM applications WHERE id = ? OR opportunity_id = ?').run(req.params.id, req.params.id);
    res.json({ status: 'success', message: 'Application record removed from CRM' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
