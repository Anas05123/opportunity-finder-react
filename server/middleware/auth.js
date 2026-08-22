import jwt from 'jsonwebtoken';
import db from '../db/sqliteClient.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'careerly-super-secret-jwt-key-2026-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate signed JWT token with live token_version
 */
export function generateToken(user) {
  const tokenVersion = user.token_version !== undefined ? user.token_version : 1;
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
      tokenVersion
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Check if a token has been explicitly revoked in SQLite blacklist
 */
export function isTokenRevoked(token) {
  if (!token) return true;
  try {
    const row = db.prepare('SELECT token FROM revoked_tokens WHERE token = ?').get(token);
    return !!row;
  } catch (e) {
    return false;
  }
}

/**
 * Explicitly revoke a single token
 */
export function revokeToken(token, userId, reason = 'LOGOUT') {
  if (!token) return;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO revoked_tokens (token, user_id, revoked_at, reason)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?)
    `).run(token, userId || 'unknown', reason);
  } catch (e) {
    console.warn('[Auth Middleware] Revoke token note:', e.message);
  }
}

/**
 * Invalidate all active sessions for a user by incrementing their token_version
 */
export function revokeAllUserTokens(userId) {
  if (!userId) return;
  try {
    db.prepare('UPDATE users SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  } catch (e) {
    console.warn('[Auth Middleware] Revoke all tokens note:', e.message);
  }
}

/**
 * Required Authentication Middleware
 * Enforces authenticated session; verifies signature, database user existence,
 * account active state, token revocation, and live database role.
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required. Please sign in to access this resource.',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check explicit revocation blacklist
  if (isTokenRevoked(token)) {
    recordSecurityEvent({
      event_type: 'TOKEN_REVOKED',
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { reason: 'TOKEN_IN_BLACKLIST' }
    });

    return res.status(401).json({ 
      error: 'Session has been revoked. Please sign in again.',
      code: 'TOKEN_REVOKED'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const targetUserId = decoded.userId || decoded.id;

    // Fetch authoritative live user state from database
    const user = db.prepare(`
      SELECT id, email, role, is_email_verified, is_disabled, token_version, created_at 
      FROM users 
      WHERE id = ?
    `).get(targetUserId);

    if (!user) {
      recordSecurityEvent({
        event_type: 'AUTH_FAILURE',
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'USER_NOT_FOUND', decoded_id: targetUserId }
      });

      return res.status(401).json({ 
        error: 'User account not found or session expired.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if account is disabled or suspended
    if (user.is_disabled === 1) {
      recordSecurityEvent({
        event_type: 'DISABLED_ACCOUNT_ACCESS_ATTEMPT',
        severity: 'HIGH',
        actor_user_id: user.id,
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { email: user.email }
      });

      return res.status(403).json({ 
        error: 'Account has been disabled or suspended. Please contact security support.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Check token version against user's live token version (supports mass logout / password reset)
    const currentVersion = user.token_version !== undefined ? user.token_version : 1;
    const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : (decoded.token_version !== undefined ? decoded.token_version : 1);
    if (tokenVersion < currentVersion) {
      recordSecurityEvent({
        event_type: 'OUTDATED_SESSION_TOKEN',
        actor_user_id: user.id,
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { token_version: tokenVersion, current_version: currentVersion }
      });

      return res.status(401).json({ 
        error: 'Session has been invalidated due to a security update or password change. Please sign in again.',
        code: 'TOKEN_REVOKED'
      });
    }

    // Attach authoritative database user (prevents forged JWT role escalation)
    req.user = user;
    req.token = token;

    // Attach career profile
    const cp = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(user.id);
    if (cp) {
      req.careerProfile = {
        ...cp,
        skills: cp.skills ? JSON.parse(cp.skills) : [],
        interests: cp.interests ? JSON.parse(cp.interests) : [],
        languages: cp.languages ? JSON.parse(cp.languages) : [],
        certifications: cp.certifications ? JSON.parse(cp.certifications) : []
      };
    } else {
      req.careerProfile = null;
    }

    // Attach search profile
    const sp = db.prepare('SELECT * FROM search_profiles WHERE user_id = ?').get(user.id);
    if (sp) {
      req.searchProfile = {
        ...sp,
        target_roles: sp.target_roles ? JSON.parse(sp.target_roles) : [],
        opportunity_types: sp.opportunity_types ? JSON.parse(sp.opportunity_types) : [],
        industries: sp.industries ? JSON.parse(sp.industries) : [],
        required_locations: sp.required_locations ? JSON.parse(sp.required_locations) : [],
        preferred_skills: sp.preferred_skills ? JSON.parse(sp.preferred_skills) : []
      };
    } else {
      req.searchProfile = null;
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      recordSecurityEvent({
        event_type: 'TOKEN_EXPIRED',
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'TOKEN_EXPIRED' }
      });
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.', code: 'TOKEN_EXPIRED' });
    }

    recordSecurityEvent({
      event_type: 'TOKEN_INVALID',
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { reason: 'INVALID_SIGNATURE', message: err.message }
    });
    return res.status(401).json({ error: 'Invalid authentication token.', code: 'INVALID_TOKEN' });
  }
}

/**
 * Optional Authentication Middleware
 * If token present and valid, attaches req.user; otherwise proceeds as anonymous guest.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    req.user = null;
    req.careerProfile = null;
    req.searchProfile = null;
    return next();
  }

  if (isTokenRevoked(token)) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, is_email_verified, is_disabled, token_version FROM users WHERE id = ?').get(decoded.userId);
    if (user && user.is_disabled !== 1) {
      const currentVersion = user.token_version !== undefined ? user.token_version : 1;
      const tokenVersion = decoded.tokenVersion !== undefined ? decoded.tokenVersion : 1;
      if (tokenVersion >= currentVersion) {
        req.user = user;
        const cp = db.prepare('SELECT * FROM career_profiles WHERE user_id = ?').get(user.id);
        if (cp) {
          req.careerProfile = {
            ...cp,
            skills: cp.skills ? JSON.parse(cp.skills) : [],
            interests: cp.interests ? JSON.parse(cp.interests) : []
          };
        }
      }
    }
  } catch (err) {
    req.user = null;
  }

  next();
}

/**
 * Verified Email Gate Middleware
 * Ensures user has verified their email address before accessing sensitive platform services.
 */
export function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.', code: 'AUTH_REQUIRED' });
  }

  if (req.user.is_email_verified !== 1) {
    return res.status(403).json({ 
      error: 'Please verify your email address to access this resource.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
}

/**
 * Role-Based Authorization Middleware (Admin Only)
 * Enforces live database role === 'admin' and logs unauthorized attempts.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please sign in.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    recordSecurityEvent({
      event_type: 'ADMIN_ACCESS_DENIED',
      severity: 'HIGH',
      actor_user_id: req.user.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { user_role: req.user.role, target_endpoint: req.originalUrl || req.path }
    });

    return res.status(403).json({ 
      error: 'Access denied. Administrative privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY'
    });
  }

  next();
}

export default { 
  generateToken, 
  authenticateToken, 
  optionalAuth, 
  requireVerifiedEmail, 
  requireAdmin,
  isTokenRevoked,
  revokeToken,
  revokeAllUserTokens
};
