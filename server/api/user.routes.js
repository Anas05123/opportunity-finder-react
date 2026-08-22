import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/sqliteClient.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateDeterministicMatchScore } from '../services/matchingEngine.js';
import { generateVerifiedJobUrl } from '../services/linkVerifier.js';
import { sanitizeStipendField, decodeHtmlEntities, sanitizeInputString, sanitizeSafeUrl, sanitizeObject } from '../services/textSanitizer.js';

const router = express.Router();

// Helper to compute profile completion %
function calculateProfileCompletion(p) {
  if (!p) return 0;
  let score = 20; // Base creation
  if (p.full_name && p.full_name.length > 2) score += 10;
  if (p.headline && p.headline.length > 5) score += 10;
  if (p.phone && p.phone.length > 5) score += 10;
  if (p.field_of_study && p.field_of_study.length > 2) score += 15;
  if (p.university && p.university.length > 2) score += 10;
  if (p.skills && (Array.isArray(p.skills) ? p.skills.length > 0 : p.skills !== '[]')) score += 15;
  if (p.resume_text && p.resume_text.length > 30) score += 10;
  return Math.min(100, score);
}

// 1. GET /api/v1/user/profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const cp = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(req.user.id);
    if (!cp) {
      return res.status(404).json({ error: 'Career profile not found' });
    }

    res.json({
      status: 'success',
      profile: {
        ...cp,
        skills: JSON.parse(cp.skills || '[]'),
        interests: JSON.parse(cp.interests || '[]'),
        languages: JSON.parse(cp.languages || '[]'),
        certifications: JSON.parse(cp.certifications || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. PUT /api/v1/user/profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const rawP = req.body || {};
    const p = sanitizeObject(rawP);

    const skillsJson = JSON.stringify(Array.isArray(p.skills) ? p.skills.map(s => sanitizeInputString(s)) : []);
    const interestsJson = JSON.stringify(Array.isArray(p.interests) ? p.interests.map(i => sanitizeInputString(i)) : []);
    const languagesJson = JSON.stringify(Array.isArray(p.languages) ? p.languages.map(l => sanitizeInputString(l)) : []);
    const certificationsJson = JSON.stringify(Array.isArray(p.certifications) ? p.certifications.map(c => sanitizeInputString(c)) : []);
    const completion = calculateProfileCompletion(p);

    const safePortfolioUrl = sanitizeSafeUrl(p.portfolio_url, null);
    const safeLinkedinUrl = sanitizeSafeUrl(p.linkedin_url, null);
    const safeGithubUrl = sanitizeSafeUrl(p.github_url, null);

    db.prepare(`
      UPDATE career_profiles 
      SET full_name = ?, headline = ?, phone = ?, degree_level = ?, degree_title = ?,
          field_of_study = ?, university = ?, graduation_date = ?, gpa = ?, experience_years = ?,
          skills = ?, interests = ?, languages = ?, certifications = ?,
          portfolio_url = ?, linkedin_url = ?, github_url = ?, resume_text = ?,
          no_ielts_preference = ?, profile_completion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      sanitizeInputString(p.full_name) || req.user.email.split('@')[0],
      sanitizeInputString(p.headline) || null,
      sanitizeInputString(p.phone) || null,
      sanitizeInputString(p.degree_level) || 'undergrad',
      sanitizeInputString(p.degree_title) || 'Bachelor of Science (BSc)',
      sanitizeInputString(p.field_of_study) || 'Computer Science',
      sanitizeInputString(p.university) || null,
      sanitizeInputString(p.graduation_date) || null,
      p.gpa !== undefined ? Number(p.gpa) : 3.5,
      p.experience_years !== undefined ? Number(p.experience_years) : 0,
      skillsJson,
      interestsJson,
      languagesJson,
      certificationsJson,
      safePortfolioUrl,
      safeLinkedinUrl,
      safeGithubUrl,
      sanitizeInputString(p.resume_text) || null,
      p.no_ielts_preference !== undefined ? (p.no_ielts_preference ? 1 : 0) : 1,
      completion,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(req.user.id);

    res.json({
      status: 'success',
      message: 'Career profile updated successfully',
      profile: {
        ...updated,
        skills: JSON.parse(updated.skills || '[]'),
        interests: JSON.parse(updated.interests || '[]'),
        languages: JSON.parse(updated.languages || '[]'),
        certifications: JSON.parse(updated.certifications || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/v1/user/search-preferences
router.get('/search-preferences', authenticateToken, (req, res) => {
  try {
    const sp = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(req.user.id);
    res.json({
      status: 'success',
      searchProfile: sp ? {
        ...sp,
        target_roles: JSON.parse(sp.target_roles || '[]'),
        opportunity_types: JSON.parse(sp.opportunity_types || '[]'),
        industries: JSON.parse(sp.industries || '[]'),
        required_locations: JSON.parse(sp.required_locations || '[]'),
        preferred_skills: JSON.parse(sp.preferred_skills || '[]')
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /api/v1/user/search-preferences
router.put('/search-preferences', authenticateToken, (req, res) => {
  try {
    const sp = req.body;
    db.prepare(`
      UPDATE search_profiles 
      SET target_roles = ?, opportunity_types = ?, industries = ?, required_locations = ?,
          remote_only = ?, min_salary = ?, max_salary = ?, salary_currency = ?,
          visa_sponsorship_required = ?, preferred_skills = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      JSON.stringify(sp.target_roles || []),
      JSON.stringify(sp.opportunity_types || ['job', 'internship']),
      JSON.stringify(sp.industries || []),
      JSON.stringify(sp.required_locations || []),
      sp.remote_only ? 1 : 0,
      sp.min_salary || 0,
      sp.max_salary || null,
      sp.salary_currency || 'USD',
      sp.visa_sponsorship_required ? 1 : 0,
      JSON.stringify(sp.preferred_skills || []),
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(req.user.id);
    res.json({
      status: 'success',
      message: 'Search preferences saved successfully',
      searchProfile: {
        ...updated,
        target_roles: JSON.parse(updated.target_roles || '[]'),
        opportunity_types: JSON.parse(updated.opportunity_types || '[]'),
        industries: JSON.parse(updated.industries || '[]'),
        required_locations: JSON.parse(updated.required_locations || '[]'),
        preferred_skills: JSON.parse(updated.preferred_skills || '[]')
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/v1/user/saved (User Saved Opportunities)
router.get('/saved', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT o.*, s.created_at as saved_at
      FROM saved_opportunities s
      JOIN opportunities o ON s.opportunity_id = o.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    const enriched = rows.map(opp => {
      const verified = generateVerifiedJobUrl(opp);
      const matchData = calculateDeterministicMatchScore(opp, req.careerProfile);
      const cleanStipend = sanitizeStipendField(opp.stipend_text || opp.stipend, opp.description);

      return {
        ...opp,
        title: decodeHtmlEntities(opp.title),
        organization: decodeHtmlEntities(opp.organization || opp.company),
        company: decodeHtmlEntities(opp.company || opp.organization),
        stipend_text: cleanStipend,
        official_apply_url: verified.verified_live_url,
        match_score: matchData.score,
        match_reasons: matchData.matchReasons,
        match_flags: matchData.flags,
        why_matches_you: matchData.whyMatches
      };
    });

    res.json({
      status: 'success',
      total_count: enriched.length,
      saved_opportunities: enriched
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. POST /api/v1/user/saved/:opportunityId (Save Opportunity)
router.post('/saved/:opportunityId', authenticateToken, (req, res) => {
  try {
    const { opportunityId } = req.params;
    const opp = db.prepare('SELECT id FROM opportunities WHERE id = ?').get(opportunityId);
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

    const saveId = `save-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT OR IGNORE INTO saved_opportunities (id, user_id, opportunity_id)
      VALUES (?, ?, ?)
    `).run(saveId, req.user.id, opportunityId);

    // Auto-create or update CRM stage as 'saved'
    const existingApp = db.prepare('SELECT id FROM applications WHERE user_id = ? AND opportunity_id = ?').get(req.user.id, opportunityId);
    if (!existingApp) {
      db.prepare(`
        INSERT INTO applications (id, user_id, opportunity_id, stage)
        VALUES (?, ?, ?, 'saved')
      `).run(`app-${crypto.randomUUID().slice(0, 8)}`, req.user.id, opportunityId);
    }

    res.json({ status: 'success', message: 'Opportunity bookmarked to your account!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. DELETE /api/v1/user/saved/:opportunityId (Unsave Opportunity)
router.delete('/saved/:opportunityId', authenticateToken, (req, res) => {
  try {
    const { opportunityId } = req.params;
    db.prepare('DELETE FROM saved_opportunities WHERE user_id = ? AND opportunity_id = ?').run(req.user.id, opportunityId);
    res.json({ status: 'success', message: 'Opportunity removed from saved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/v1/user/dashboard-recommendations (Personalized Feed)
router.get('/dashboard-recommendations', authenticateToken, (req, res) => {
  try {
    const userProf = req.careerProfile || { major: 'Computer Science', gpa: 3.5 };
    const rows = db.prepare("SELECT * FROM opportunities WHERE status = 'active' ORDER BY created_at DESC LIMIT 60").all();

    const scored = rows.map(opp => {
      const verified = generateVerifiedJobUrl(opp);
      const matchData = calculateDeterministicMatchScore(opp, userProf);
      const cleanStipend = sanitizeStipendField(opp.stipend_text || opp.stipend, opp.description);

      return {
        ...opp,
        title: decodeHtmlEntities(opp.title),
        organization: decodeHtmlEntities(opp.organization || opp.company),
        company: decodeHtmlEntities(opp.company || opp.organization),
        stipend_text: cleanStipend,
        official_apply_url: verified.verified_live_url,
        match_score: matchData.score,
        match_reasons: matchData.matchReasons,
        match_flags: matchData.flags,
        why_matches_you: matchData.whyMatches
      };
    });

    scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    res.json({
      status: 'success',
      profile_strength: userProf.profile_completion || 40,
      total_recommendations: scored.length,
      top_matches: scored.slice(0, 12),
      all_recommendations: scored
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. GET /api/v1/user/notifications
router.get('/notifications', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
    const unreadCount = rows.filter(r => !r.is_read).length;
    res.json({ status: 'success', unread_count: unreadCount, notifications: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. PUT /api/v1/user/account/password
router.put('/account/password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid current password and new password (min 6 chars) required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const nextTokenVersion = (user.token_version || 1) + 1;
    db.prepare('UPDATE users SET password_hash = ?, token_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, nextTokenVersion, req.user.id);

    res.json({ status: 'success', message: 'Password updated successfully! All other sessions have been invalidated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. DELETE /api/v1/user/account
router.delete('/account', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    res.json({ status: 'success', message: 'User account and all associated data permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. PUT /api/v1/user/onboarding - Complete 4-Step SaaS Onboarding
router.put('/onboarding', authenticateToken, (req, res) => {
  try {
    const { education, targetRoles, skills, experience_years, preferences } = req.body;

    const edu = education || {};
    const pref = preferences || {};
    const skillsArray = Array.isArray(skills) ? skills : [];
    const targetRolesArray = Array.isArray(targetRoles) ? targetRoles : [];
    const locationsArray = Array.isArray(pref.target_locations) && pref.target_locations.length > 0 ? pref.target_locations : ['Worldwide', 'Remote'];
    const oppTypesArray = Array.isArray(pref.opportunity_types) && pref.opportunity_types.length > 0 ? pref.opportunity_types : ['job', 'internship'];

    // 1. Update Career Profile
    db.prepare(`
      UPDATE career_profiles
      SET full_name = COALESCE(?, full_name),
          degree_level = COALESCE(?, degree_level),
          degree_title = COALESCE(?, degree_title),
          field_of_study = COALESCE(?, field_of_study),
          university = COALESCE(?, university),
          graduation_date = COALESCE(?, graduation_date),
          gpa = COALESCE(?, gpa),
          experience_years = COALESCE(?, experience_years),
          skills = ?,
          no_ielts_preference = ?,
          profile_completion = 90,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      edu.full_name || null,
      edu.degree_level || 'undergrad',
      edu.degree_title || 'Bachelor of Science (BSc)',
      edu.field_of_study || 'Computer Science',
      edu.university || null,
      edu.graduation_date || null,
      edu.gpa ? Number(edu.gpa) : 3.5,
      experience_years !== undefined ? Number(experience_years) : 0,
      JSON.stringify(skillsArray),
      pref.no_ielts_preference !== undefined ? (pref.no_ielts_preference ? 1 : 0) : 1,
      req.user.id
    );

    // 2. Update Search Profile
    db.prepare(`
      UPDATE search_profiles
      SET target_roles = ?,
          opportunity_types = ?,
          required_locations = ?,
          work_modality = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      JSON.stringify(targetRolesArray),
      JSON.stringify(oppTypesArray),
      JSON.stringify(locationsArray),
      pref.work_modality || 'all',
      req.user.id
    );

    // 3. Mark user onboarding completed
    db.prepare('UPDATE users SET onboarding_completed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);

    const updatedCareer = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(req.user.id);
    const updatedSearch = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(req.user.id);

    res.json({
      status: 'success',
      message: 'Onboarding completed successfully!',
      careerProfile: updatedCareer ? {
        ...updatedCareer,
        skills: JSON.parse(updatedCareer.skills || '[]'),
        interests: JSON.parse(updatedCareer.interests || '[]'),
        languages: JSON.parse(updatedCareer.languages || '[]'),
        certifications: JSON.parse(updatedCareer.certifications || '[]')
      } : null,
      searchProfile: updatedSearch ? {
        ...updatedSearch,
        target_roles: JSON.parse(updatedSearch.target_roles || '[]'),
        opportunity_types: JSON.parse(updatedSearch.opportunity_types || '[]'),
        required_locations: JSON.parse(updatedSearch.required_locations || '[]')
      } : null
    });
  } catch (err) {
    console.error('[Onboarding Error]:', err.message);
    res.status(500).json({ error: 'Failed to complete onboarding: ' + err.message });
  }
});

export default router;
