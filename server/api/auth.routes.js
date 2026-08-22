import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/sqliteClient.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

const router = express.Router();

function safeJsonParse(raw, fallback = []) {
  if (!raw) return fallback;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/**
 * 1. POST /api/v1/auth/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, degree_level, major, target_locations } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ 
        error: 'An account with this email address already exists. Please sign in instead.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const role = (cleanEmail === 'ayarianas79@gmail.com' || cleanEmail.includes('admin@') || cleanEmail.startsWith('anas@')) ? 'admin' : 'user';

    // 1. Insert User
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, is_email_verified)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, cleanEmail, passwordHash, role, 1);

    // 2. Insert Initial Career Profile
    const profileId = `cp-${userId}`;
    const name = (full_name || cleanEmail.split('@')[0]).trim();
    const degLevel = degree_level || 'undergrad';
    const fieldOfStudy = major || 'Computer Science';

    db.prepare(`
      INSERT INTO career_profiles (id, user_id, full_name, degree_level, field_of_study, profile_completion)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(profileId, userId, name, degLevel, fieldOfStudy, 35);

    // 3. Insert Initial Search Profile
    const searchProfId = `sp-${userId}`;
    const defaultLocations = Array.isArray(target_locations) && target_locations.length > 0 ? target_locations : ['Worldwide', 'Remote'];

    db.prepare(`
      INSERT INTO search_profiles (id, user_id, target_roles, required_locations)
      VALUES (?, ?, ?, ?)
    `).run(searchProfId, userId, JSON.stringify([fieldOfStudy]), JSON.stringify(defaultLocations));

    // 4. Create Welcome Notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      'Welcome to Careerly! 🚀',
      'Your account has been created. Complete your career profile to unlock 90%+ match scoring.',
      'system'
    );

    const userRecord = { id: userId, email: cleanEmail, role, is_email_verified: 1 };
    const token = generateToken(userRecord);

    const careerProfile = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(userId);
    const searchProfile = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(userId);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully!',
      token,
      user: userRecord,
      careerProfile: careerProfile ? {
        ...careerProfile,
        skills: safeJsonParse(careerProfile.skills, []),
        interests: safeJsonParse(careerProfile.interests, []),
        languages: safeJsonParse(careerProfile.languages, []),
        certifications: safeJsonParse(careerProfile.certifications, [])
      } : null,
      searchProfile: searchProfile ? {
        ...searchProfile,
        target_roles: safeJsonParse(searchProfile.target_roles, []),
        opportunity_types: safeJsonParse(searchProfile.opportunity_types, []),
        required_locations: safeJsonParse(searchProfile.required_locations, [])
      } : null
    });

  } catch (err) {
    console.error('[Signup Error]:', err.message);
    res.status(500).json({ error: 'Failed to create account: ' + err.message });
  }
});

/**
 * 2. POST /api/v1/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      recordSecurityEvent({
        event_type: 'AUTH_FAILURE',
        actor_email: cleanEmail,
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'INVALID_CREDENTIALS' }
      });

      return res.status(401).json({ 
        error: 'Invalid email or password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      recordSecurityEvent({
        event_type: 'AUTH_FAILURE',
        actor_email: cleanEmail,
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'INVALID_CREDENTIALS' }
      });

      return res.status(401).json({ 
        error: 'Invalid email or password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const userRecord = { 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      is_email_verified: user.is_email_verified,
      created_at: user.created_at
    };

    const token = generateToken(userRecord);

    const careerProfile = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(user.id);
    const searchProfile = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(user.id);

    res.json({
      status: 'success',
      message: 'Signed in successfully!',
      token,
      user: userRecord,
      careerProfile: careerProfile ? {
        ...careerProfile,
        skills: JSON.parse(careerProfile.skills || '[]'),
        interests: JSON.parse(careerProfile.interests || '[]'),
        languages: JSON.parse(careerProfile.languages || '[]'),
        certifications: JSON.parse(careerProfile.certifications || '[]')
      } : null,
      searchProfile: searchProfile ? {
        ...searchProfile,
        target_roles: JSON.parse(searchProfile.target_roles || '[]'),
        opportunity_types: JSON.parse(searchProfile.opportunity_types || '[]'),
        required_locations: JSON.parse(searchProfile.required_locations || '[]')
      } : null
    });

  } catch (err) {
    console.error('[Login Error]:', err.message);
    res.status(500).json({ error: 'Authentication error: ' + err.message });
  }
});

/**
 * 3. GET /api/v1/auth/me (Current Session Context)
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    user: req.user,
    careerProfile: req.careerProfile,
    searchProfile: req.searchProfile
  });
});

/**
 * 4. POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);

    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

      db.prepare(`
        UPDATE users 
        SET reset_password_token = ?, reset_password_expires_at = ? 
        WHERE id = ?
      `).run(resetToken, expiresAt, user.id);
    }

    // Always respond with success to prevent user email enumeration
    res.json({
      status: 'success',
      message: 'If an account exists with that email, a password reset link has been prepared.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. POST /api/v1/auth/reset-password
 */
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid reset token and password (min 6 chars) required.' });
    }

    const user = db.prepare(`
      SELECT id FROM users 
      WHERE reset_password_token = ? AND reset_password_expires_at > CURRENT_TIMESTAMP
    `).get(token);

    if (!user) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, reset_password_token = NULL, reset_password_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newHash, user.id);

    res.json({
      status: 'success',
      message: 'Password successfully reset! You can now log in with your new password.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. POST /api/v1/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ status: 'success', message: 'Logged out successfully.' });
});

export default router;
