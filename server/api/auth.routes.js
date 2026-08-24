import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db/sqliteClient.js';
import { generateToken, authenticateToken, revokeToken, revokeAllUserTokens } from '../middleware/auth.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';
import { validateEmailSafety } from '../services/security/disposableEmailChecker.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/mailer.js';
import { sanitizeInputString, sanitizeSafeUrl } from '../services/textSanitizer.js';

const router = express.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'ayarianas79@gmail.com').trim().toLowerCase();

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
 * Staged registration: Validates email, blocks disposable domains,
 * saves to pending_registrations, and sends 6-digit verification code.
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // 1. Email format and disposable domain verification
    const emailCheck = validateEmailSafety(email);
    if (!emailCheck.isValid) {
      return res.status(400).json({ error: emailCheck.error || 'Invalid email address.' });
    }

    const cleanEmail = emailCheck.normalizedEmail;

    // 2. Password complexity gate
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // 3. Prevent duplicate accounts by normalized email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account with this email address already exists. Please sign in instead.',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const cleanFullName = sanitizeInputString(full_name || '');
    const displayName = (cleanFullName || cleanEmail.split('@')[0]).trim();
    const passwordHash = bcrypt.hashSync(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    const cooldownUntil = new Date(Date.now() + 60 * 1000).toISOString(); // 60 seconds
    const pendingId = `pnd-${crypto.randomUUID().slice(0, 8)}`;
    const clientIp = getSafeClientIp(req);

    // 4. Save or update pending registration
    const existingPending = db.prepare('SELECT id FROM pending_registrations WHERE email = ?').get(cleanEmail);
    if (existingPending) {
      db.prepare(`
        UPDATE pending_registrations
        SET password_hash = ?, full_name = ?, verification_code = ?, verification_token = ?,
            verification_code_expires_at = ?, resend_cooldown_until = ?, attempts = 0, ip_address = ?, created_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(passwordHash, displayName, verificationCode, verificationToken, expiresAt, cooldownUntil, clientIp, cleanEmail);
    } else {
      db.prepare(`
        INSERT INTO pending_registrations (
          id, email, password_hash, full_name, verification_code, verification_token,
          verification_code_expires_at, resend_cooldown_until, attempts, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(pendingId, cleanEmail, passwordHash, displayName, verificationCode, verificationToken, expiresAt, cooldownUntil, clientIp);
    }

    // 5. Dispatch email with 6-digit code
    await sendVerificationEmail({
      to: cleanEmail,
      code: verificationCode,
      token: verificationToken,
      name: displayName
    });

    res.status(200).json({
      status: 'verification_required',
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please enter it to activate your account.`,
      email: cleanEmail,
      cooldownSeconds: 60
    });

  } catch (err) {
    console.error('[Signup Error]:', err.message);
    res.status(500).json({ error: 'Failed to initiate registration: ' + err.message });
  }
});

/**
 * 2. POST /api/v1/auth/verify-email
 * Verifies code or token, creates permanent user, career profile, and logs in.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({ error: 'Email address and verification code are required.' });
    }

    const cleanEmail = email ? email.toLowerCase().trim() : null;

    let pending;
    if (token) {
      pending = db.prepare(`
        SELECT * FROM pending_registrations 
        WHERE verification_token = ? AND verification_code_expires_at > CURRENT_TIMESTAMP
      `).get(token);
    } else {
      pending = db.prepare(`
        SELECT * FROM pending_registrations 
        WHERE email = ? AND verification_code_expires_at > CURRENT_TIMESTAMP
      `).get(cleanEmail);
    }

    if (!pending) {
      return res.status(400).json({ 
        error: 'Verification code has expired or registration was not found. Please register again.' 
      });
    }

    // Check code match if not token verification
    if (!token && pending.verification_code !== String(code).trim()) {
      const newAttempts = (pending.attempts || 0) + 1;
      if (newAttempts >= 5) {
        db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pending.id);
        return res.status(400).json({ 
          error: 'Too many incorrect attempts. For your security, this registration has been cancelled. Please register again.' 
        });
      }

      db.prepare('UPDATE pending_registrations SET attempts = ? WHERE id = ?').run(newAttempts, pending.id);
      return res.status(400).json({ 
        error: `Incorrect verification code. ${5 - newAttempts} attempts remaining.` 
      });
    }

    // Code is valid! Create permanent user account
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    // Strict Role Assignment: Only exact match to configured ADMIN_EMAIL receives 'admin'
    const role = pending.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';

    // 1. Insert permanent user
    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, is_email_verified, is_disabled, token_version, auth_provider, onboarding_completed)
      VALUES (?, ?, ?, ?, 1, 0, 1, 'email', 0)
    `).run(userId, pending.email, pending.password_hash, role);

    // 2. Insert initial career profile
    const profileId = `cp-${userId}`;
    db.prepare(`
      INSERT INTO career_profiles (id, user_id, full_name, degree_level, field_of_study, profile_completion)
      VALUES (?, ?, ?, 'undergrad', 'Computer Science', 35)
    `).run(profileId, userId, pending.full_name);

    // 3. Insert initial search profile
    const searchProfId = `sp-${userId}`;
    db.prepare(`
      INSERT INTO search_profiles (id, user_id, target_roles, required_locations)
      VALUES (?, ?, ?, ?)
    `).run(searchProfId, userId, JSON.stringify(['Software Engineering']), JSON.stringify(['Worldwide', 'Remote']));

    // 4. Create welcome notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      'Welcome to Careerly! 🎉',
      'Your email is verified. Complete your 4-step profile calibration to unlock precision opportunity matching.',
      'system'
    );

    // 5. Clean up pending registration
    db.prepare('DELETE FROM pending_registrations WHERE id = ?').run(pending.id);

    const userRecord = {
      id: userId,
      email: pending.email,
      role,
      is_email_verified: 1,
      auth_provider: 'email',
      avatar_url: null,
      onboarding_completed: 0,
      token_version: 1,
      created_at: new Date().toISOString()
    };

    const jwtToken = generateToken(userRecord);

    recordSecurityEvent({
      event_type: 'USER_REGISTERED',
      actor_user_id: userId,
      actor_email: pending.email,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { role, auth_provider: 'email' }
    });

    res.status(201).json({
      status: 'success',
      message: 'Account successfully verified and activated!',
      token: jwtToken,
      user: userRecord,
      needsOnboarding: true
    });

  } catch (err) {
    console.error('[Verify Email Error]:', err.message);
    res.status(500).json({ error: 'Failed to verify email: ' + err.message });
  }
});

/**
 * 3. POST /api/v1/auth/resend-verification
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const cleanEmail = email.toLowerCase().trim();
    const pending = db.prepare('SELECT * FROM pending_registrations WHERE email = ?').get(cleanEmail);

    if (!pending) {
      return res.status(404).json({ error: 'No pending registration found for this email address. Please register again.' });
    }

    if (pending.resend_cooldown_until && new Date(pending.resend_cooldown_until) > new Date()) {
      const remainingSeconds = Math.ceil((new Date(pending.resend_cooldown_until) - new Date()) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${remainingSeconds} seconds before requesting another code.`,
        remainingSeconds 
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const cooldownUntil = new Date(Date.now() + 60 * 1000).toISOString();

    db.prepare(`
      UPDATE pending_registrations
      SET verification_code = ?, verification_token = ?, verification_code_expires_at = ?,
          resend_cooldown_until = ?, attempts = 0, created_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(verificationCode, verificationToken, expiresAt, cooldownUntil, pending.id);

    await sendVerificationEmail({
      to: cleanEmail,
      code: verificationCode,
      token: verificationToken,
      name: pending.full_name
    });

    res.json({
      status: 'success',
      message: `A fresh 6-digit code has been dispatched to ${cleanEmail}.`,
      cooldownSeconds: 60
    });

  } catch (err) {
    console.error('[Resend Verification Error]:', err.message);
    res.status(500).json({ error: 'Failed to resend verification code: ' + err.message });
  }
});

/**
 * 4. POST /api/v1/auth/google
 * Official Google OAuth Ingestion
 */
router.post('/google', async (req, res) => {
  try {
    let { email, full_name, google_id, avatar_url, credential } = req.body;

    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) email = payload.email;
          if (payload.name || payload.given_name) full_name = payload.name || payload.given_name;
          if (payload.sub) google_id = payload.sub;
          if (payload.picture) avatar_url = payload.picture;
        }
      } catch (e) {
        console.warn('[Google Auth] Could not decode credential payload:', e.message);
      }
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid Google email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanFullName = sanitizeInputString(full_name || '');
    const displayName = (cleanFullName || cleanEmail.split('@')[0]).trim();
    const userGoogleId = google_id ? sanitizeInputString(google_id) : null;
    const userAvatar = avatar_url ? sanitizeSafeUrl(avatar_url, null) : null;

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    let isNewUser = false;
    const isAdminUser = cleanEmail === ADMIN_EMAIL;

    if (user) {
      // Check if disabled
      if (user.is_disabled === 1) {
        return res.status(403).json({ error: 'Account has been disabled or suspended.', code: 'ACCOUNT_DISABLED' });
      }

      // Existing User: Link Google ID and avatar, and ensure admin role if email matches
      if (isAdminUser) {
        db.prepare(`
          UPDATE users 
          SET google_id = COALESCE(google_id, ?),
              avatar_url = COALESCE(?, avatar_url),
              role = 'admin',
              is_email_verified = 1,
              onboarding_completed = 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(userGoogleId, userAvatar, user.id);
      } else {
        db.prepare(`
          UPDATE users 
          SET google_id = COALESCE(google_id, ?),
              avatar_url = COALESCE(?, avatar_url),
              is_email_verified = 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(userGoogleId, userAvatar, user.id);
      }
    } else {
      // New User: Create permanent record immediately
      isNewUser = true;
      const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const randomSecret = crypto.randomBytes(32).toString('hex');
      const passwordHash = bcrypt.hashSync(randomSecret, 10);
      const role = isAdminUser ? 'admin' : 'user';
      const onboardingCompleted = isAdminUser ? 1 : 0;

      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, is_email_verified, is_disabled, token_version, auth_provider, google_id, avatar_url, onboarding_completed)
        VALUES (?, ?, ?, ?, 1, 0, 1, 'google', ?, ?, ?)
      `).run(userId, cleanEmail, passwordHash, role, userGoogleId, userAvatar, onboardingCompleted);

      const profileId = `cp-${userId}`;
      db.prepare(`
        INSERT INTO career_profiles (id, user_id, full_name, degree_level, field_of_study, profile_completion)
        VALUES (?, ?, ?, 'undergrad', 'Computer Science', 85)
      `).run(profileId, userId, displayName);

      const searchProfId = `sp-${userId}`;
      db.prepare(`
        INSERT INTO search_profiles (id, user_id, target_roles, required_locations)
        VALUES (?, ?, ?, ?)
      `).run(searchProfId, userId, JSON.stringify(['Software Engineering']), JSON.stringify(['Worldwide', 'Remote']));

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        `notif-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        isAdminUser ? 'Admin Session Authenticated 🛡️' : 'Google Sign-In Connected! 🚀',
        isAdminUser ? 'Welcome back to Careerly Admin Security Operations.' : 'Your Google account has been connected to Careerly. Complete your onboarding to begin matching.',
        'system'
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    const userRecord = {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      is_email_verified: 1,
      auth_provider: 'google',
      avatar_url: updatedUser.avatar_url,
      onboarding_completed: updatedUser.role === 'admin' ? 1 : (updatedUser.onboarding_completed || 0),
      token_version: updatedUser.token_version || 1,
      created_at: updatedUser.created_at
    };

    const token = generateToken(userRecord);
    const careerProfile = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(updatedUser.id);
    const searchProfile = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(updatedUser.id);
    const needsOnboarding = updatedUser.role === 'admin' ? false : !updatedUser.onboarding_completed;

    recordSecurityEvent({
      event_type: 'OAUTH_LOGIN_SUCCESS',
      actor_user_id: updatedUser.id,
      actor_email: cleanEmail,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { provider: 'google', is_new_user: isNewUser }
    });

    res.json({
      status: 'success',
      message: 'Authenticated with Google successfully!',
      token,
      user: userRecord,
      needsOnboarding,
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
    console.error('[Google Auth Error]:', err.message);
    res.status(500).json({ error: 'Failed to process Google sign-in: ' + err.message });
  }
});

/**
 * 5. POST /api/v1/auth/login
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
        details: { reason: 'USER_NOT_FOUND' }
      });

      return res.status(401).json({ 
        error: 'Invalid email or password. Please check your credentials.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (user.is_disabled === 1) {
      recordSecurityEvent({
        event_type: 'DISABLED_ACCOUNT_LOGIN_ATTEMPT',
        severity: 'HIGH',
        actor_user_id: user.id,
        actor_email: cleanEmail,
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'ACCOUNT_DISABLED' }
      });

      return res.status(403).json({
        error: 'Account has been disabled or suspended. Please contact security support.',
        code: 'ACCOUNT_DISABLED'
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
        details: { reason: 'PASSWORD_MISMATCH' }
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
      auth_provider: user.auth_provider || 'email',
      avatar_url: user.avatar_url || null,
      onboarding_completed: user.onboarding_completed || 0,
      token_version: user.token_version || 1,
      created_at: user.created_at
    };

    const token = generateToken(userRecord);

    const careerProfile = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(user.id);
    const searchProfile = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(user.id);
    const needsOnboarding = !user.onboarding_completed && (!careerProfile || careerProfile.profile_completion < 45);

    res.json({
      status: 'success',
      message: 'Signed in successfully!',
      token,
      user: userRecord,
      needsOnboarding,
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
    console.error('[Login Error]:', err.message);
    res.status(500).json({ error: 'Authentication error: ' + err.message });
  }
});

/**
 * 6. GET /api/v1/auth/me (Current Session Context)
 */
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const needsOnboarding = user ? (!user.onboarding_completed && (!req.careerProfile || req.careerProfile.profile_completion < 45)) : false;

  res.json({
    status: 'success',
    user: {
      ...req.user,
      onboarding_completed: user?.onboarding_completed || 0,
      avatar_url: user?.avatar_url || null
    },
    needsOnboarding,
    careerProfile: req.careerProfile,
    searchProfile: req.searchProfile
  });
});

/**
 * 7. POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email address is required.' });

    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE users 
        SET reset_password_token = ?, reset_password_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(resetCode, expiresAt, user.id);

      const cp = db.prepare('SELECT full_name FROM career_profiles WHERE user_id = ?').get(user.id);
      await sendPasswordResetEmail({
        to: user.email,
        code: resetCode,
        token: resetToken,
        name: cp?.full_name || 'Member'
      });
    }

    res.json({
      status: 'success',
      message: 'If an account exists with that email, a 6-digit password reset code has been sent.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed processing password reset: ' + err.message });
  }
});

/**
 * 8. POST /api/v1/auth/reset-password
 * Updates password and increments token_version to invalidate all existing sessions
 */
router.post('/reset-password', (req, res) => {
  try {
    const { email, code, token, newPassword } = req.body;
    const resetKey = code || token;

    if (!resetKey || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid reset code and new password (min 6 characters) required.' });
    }

    let user;
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      user = db.prepare(`
        SELECT id, token_version FROM users 
        WHERE email = ? AND reset_password_token = ? AND reset_password_expires_at > CURRENT_TIMESTAMP
      `).get(cleanEmail, String(resetKey).trim());
    } else {
      user = db.prepare(`
        SELECT id, token_version FROM users 
        WHERE reset_password_token = ? AND reset_password_expires_at > CURRENT_TIMESTAMP
      `).get(String(resetKey).trim());
    }

    if (!user) {
      return res.status(400).json({ error: 'Password reset code is invalid or has expired.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const nextTokenVersion = (user.token_version || 1) + 1;

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, reset_password_token = NULL, reset_password_expires_at = NULL,
          token_version = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newHash, nextTokenVersion, user.id);

    recordSecurityEvent({
      event_type: 'PASSWORD_RESET_SUCCESS',
      actor_user_id: user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { invalidated_all_sessions: true }
    });

    res.json({
      status: 'success',
      message: 'Password successfully reset! All previous sessions have been invalidated. You can now sign in.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password: ' + err.message });
  }
});

/**
 * 9. POST /api/v1/auth/logout
 * Revokes current session token
 */
router.post('/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    revokeToken(token, 'anonymous_logout', 'USER_LOGOUT');
  }
  res.json({ status: 'success', message: 'Logged out successfully and token revoked.' });
});

/**
 * 10. POST /api/v1/auth/logout-all (Revoke All User Sessions)
 */
router.post('/logout-all', authenticateToken, (req, res) => {
  try {
    revokeAllUserTokens(req.user.id);
    if (req.token) {
      revokeToken(req.token, req.user.id, 'LOGOUT_ALL');
    }
    recordSecurityEvent({
      event_type: 'MASS_SESSION_REVOCATION',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { reason: 'USER_INITIATED_LOGOUT_ALL' }
    });
    res.json({ status: 'success', message: 'All active sessions have been invalidated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke sessions: ' + err.message });
  }
});

export default router;
