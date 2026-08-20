import jwt from 'jsonwebtoken';
import db from '../db/sqliteClient.js';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'careerly-super-secret-jwt-key-2026-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Required Authentication Middleware
 * Enforces authenticated session; attaches req.user, req.careerProfile, req.searchProfile.
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, is_email_verified, created_at FROM users WHERE id = ?').get(decoded.userId);

    if (!user) {
      recordSecurityEvent({
        event_type: 'AUTH_FAILURE',
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { reason: 'USER_NOT_FOUND' }
      });

      return res.status(401).json({ 
        error: 'User account not found or session expired.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Attach user
    req.user = user;

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
      details: { reason: 'INVALID_SIGNATURE' }
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, role, is_email_verified, created_at FROM users WHERE id = ?').get(decoded.userId);
    if (user) {
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
  } catch (err) {
    req.user = null;
  }

  next();
}

/**
 * Role-Based Authorization Middleware (Admin Only)
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    recordSecurityEvent({
      event_type: 'ADMIN_ACCESS_DENIED',
      actor_user_id: req.user?.id,
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { user_role: req.user?.role || 'anonymous' }
    });

    return res.status(403).json({ 
      error: 'Access denied. Administrative privileges required.',
      code: 'FORBIDDEN_ADMIN_ONLY'
    });
  }
  next();
}

export default { generateToken, authenticateToken, optionalAuth, requireAdmin };
