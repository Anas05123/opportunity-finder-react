/**
 * CAREERLY RUNTIME SECURITY EVENT SERVICE (PHASE 4.1 HARDENED)
 * Centralized, secret-safe, fail-safe security event logging subsystem.
 * 
 * Strict Privacy & Information-Leakage Controls:
 * - Drops all URL search query parameters, fragments, and credentials before persistence.
 * - Deep recursive sanitizer with string-level token/credential pattern scrubbing.
 * - Anti-IP-spoofing peer socket inspection.
 * - Granular deduplication preserving distinct attack vectors.
 * - Safe retention boundaries preventing accidental table wipes.
 * - Fail-safe database execution guaranteeing zero request disruption.
 */

import crypto from 'crypto';
import db from '../../db/sqliteClient.js';

/**
 * Standard Security Event Types & Severity Matrix
 */
export const EVENT_SEVERITIES = {
  AUTH_FAILURE: 'MEDIUM',
  TOKEN_INVALID: 'MEDIUM',
  TOKEN_EXPIRED: 'LOW',
  AUTHORIZATION_DENIED: 'HIGH',
  IDOR_ATTEMPT: 'CRITICAL',
  ADMIN_ACCESS_DENIED: 'HIGH',
  SSRF_BLOCKED: 'HIGH',
  RATE_LIMIT_EXCEEDED: 'MEDIUM',
  INVALID_FILE_UPLOAD: 'MEDIUM',
  PROMPT_INJECTION_DETECTED: 'HIGH',
  SUSPICIOUS_REQUEST: 'HIGH'
};

const VALID_SEVERITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL']);

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /jwt/i,
  /auth/i,
  /cookie/i,
  /api[_-]?key/i,
  /credential/i,
  /cv/i,
  /resume/i,
  /filebase64/i,
  /gemini/i,
  /smtp/i,
  /reset/i,
  /session/i
];

// In-memory deduplication cache (prevents event storms within 1 second window)
const recentEventsCache = new Map();
const DEDUP_WINDOW_MS = 1000;

/**
 * Sanitize URLs before persistence: strip query parameters, auth, and fragments
 */
export function sanitizeUrlForTelemetry(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const parsed = new URL(rawUrl.trim());
    return {
      hostname: parsed.hostname,
      protocol: parsed.protocol,
      port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
      pathname: parsed.pathname
    };
  } catch (e) {
    return {
      raw_target: rawUrl.slice(0, 100).replace(/[:/?&=].*$/, '') // Safe prefix only
    };
  }
}

/**
 * Recursively sanitize metadata and scrub embedded credentials from string values
 */
export function sanitizeSecurityDetails(data, depth = 0) {
  if (depth > 5) return '[TRUNCATED_DEPTH]';
  if (!data || typeof data !== 'object') {
    if (typeof data === 'string') {
      let str = data;
      // Redact Bearer tokens
      if (/bearer\s+[a-zA-Z0-9._-]+/gi.test(str)) {
        str = str.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
      }
      // Redact query parameter credentials
      if (/(token|password|secret|key|jwt|apikey|api_key)=([^&\s]+)/gi.test(str)) {
        str = str.replace(/(token|password|secret|key|jwt|apikey|api_key)=([^&\s]+)/gi, '$1=[REDACTED]');
      }
      if (str.length > 300) {
        str = str.slice(0, 300) + '...[TRUNCATED]';
      }
      return str;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeSecurityDetails(item, depth + 1));
  }

  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some(pat => pat.test(k));
    if (isSensitive) {
      clean[k] = '[REDACTED]';
    } else if (k === 'target_url' || k === 'url') {
      clean[k] = sanitizeUrlForTelemetry(v);
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeSecurityDetails(v, depth + 1);
    } else if (typeof v === 'string') {
      let str = v;
      if (/bearer\s+[a-zA-Z0-9._-]+/gi.test(str)) {
        str = str.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
      }
      if (/(token|password|secret|key|jwt|apikey|api_key)=([^&\s]+)/gi.test(str)) {
        str = str.replace(/(token|password|secret|key|jwt|apikey|api_key)=([^&\s]+)/gi, '$1=[REDACTED]');
      }
      if (str.length > 500) {
        str = str.slice(0, 500) + '...[TRUNCATED]';
      }
      clean[k] = str;
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

/**
 * Safely extract client IP address without blind proxy header trust
 */
export function getSafeClientIp(req) {
  if (!req) return '127.0.0.1';
  // Trust proxy ONLY if explicitly enabled in server environment AND application config
  if (process.env.TRUST_PROXY === 'true' && req.app?.get('trust proxy') && req.headers['x-forwarded-for']) {
    const forwarded = req.headers['x-forwarded-for'].split(',')[0].trim();
    return forwarded.slice(0, 45);
  }
  // Default: Direct TCP socket peer address
  return (req.socket?.remoteAddress || req.ip || '127.0.0.1').slice(0, 45);
}

/**
 * Central Fail-Safe Method to Record Runtime Security Events
 */
export function recordSecurityEvent(eventData) {
  try {
    const {
      event_type,
      severity: explicitSeverity,
      actor_user_id,
      actor_ip,
      actor_email,
      request_path,
      request_method,
      details = {}
    } = eventData;

    // Validate Event Type
    const validEventType = EVENT_SEVERITIES[event_type] ? event_type : 'SUSPICIOUS_REQUEST';
    
    // Validate Severity
    let severity = EVENT_SEVERITIES[validEventType] || 'MEDIUM';
    if (explicitSeverity && VALID_SEVERITIES.has(explicitSeverity)) {
      severity = explicitSeverity;
    }

    // Sanitize metadata
    const sanitizedDetails = sanitizeSecurityDetails(details);

    // Safe Deduplication Key including distinct target/resource to prevent collapsing separate attacks
    const cleanPath = (request_path || '').slice(0, 200);
    const cleanMethod = (request_method || 'GET').toUpperCase().slice(0, 10);
    const safeIp = (actor_ip || '127.0.0.1').slice(0, 45);
    const distinctTarget = sanitizedDetails.target_resource_id || 
                           sanitizedDetails.target_url?.hostname || 
                           sanitizedDetails.pattern_detected || '';
    const dedupKey = `${validEventType}:${safeIp}:${cleanMethod}:${cleanPath}:${distinctTarget}`;

    const now = Date.now();
    const lastSeen = recentEventsCache.get(dedupKey);
    if (lastSeen && (now - lastSeen < DEDUP_WINDOW_MS)) {
      return { status: 'deduplicated' };
    }
    recentEventsCache.set(dedupKey, now);

    // Housekeep deduplication cache if large
    if (recentEventsCache.size > 1000) {
      for (const [k, ts] of recentEventsCache.entries()) {
        if (now - ts > DEDUP_WINDOW_MS * 10) recentEventsCache.delete(k);
      }
    }

    // Safe email hash (never store plaintext email in event telemetry)
    let emailHash = null;
    if (actor_email && typeof actor_email === 'string') {
      emailHash = crypto.createHash('sha256').update(actor_email.toLowerCase().trim()).digest('hex').slice(0, 16);
    }

    const eventId = `se-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;

    db.prepare(`
      INSERT INTO security_events (
        id, event_type, severity, actor_user_id, actor_ip,
        actor_email_hash, request_path, request_method, details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      eventId,
      validEventType,
      severity,
      actor_user_id || null,
      safeIp,
      emailHash,
      cleanPath,
      cleanMethod,
      JSON.stringify(sanitizedDetails)
    );

    // Asynchronously trigger operational security alert for HIGH/CRITICAL events (Fail-Safe)
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      import('./securityAlerts.js').then(m => {
        m.triggerSecurityAlert({
          alert_type: validEventType,
          severity,
          title: `${validEventType.replace(/_/g, ' ')} Incident`,
          summary: `Defensive perimeter triggered ${validEventType} on ${cleanMethod} ${cleanPath}.`,
          source: 'RUNTIME_TELEMETRY',
          details: sanitizedDetails,
          targetKey: `${safeIp}:${cleanPath}`
        }).catch(() => {});
      }).catch(() => {});
    }

    return { status: 'recorded', event_id: eventId };
  } catch (err) {
    // Fail-safe: NEVER crash the calling request if event logging fails
    console.error('[SecurityEvent Logger Safe-Catch]:', err.message);
    return { status: 'error', error: err.message };
  }
}

/**
 * Cleanup expired security events with strict safety bounds
 * (Rejects negative, non-numeric, or dangerously small retention values)
 */
export function cleanupExpiredEvents(retentionDays = 90) {
  try {
    const parsedDays = parseInt(retentionDays, 10);
    // Strict safety floor: minimum 7 days, maximum 3650 days (10 years), fallback to 90
    if (isNaN(parsedDays) || parsedDays < 7 || parsedDays > 3650) {
      const fallbackDays = 90;
      const result = db.prepare(`
        DELETE FROM security_events 
        WHERE created_at < datetime('now', '-' || ? || ' days')
      `).run(fallbackDays);
      return { deleted: result.changes, retention_days: fallbackDays, warning: 'Invalid retention days value clamped to 90 days' };
    }

    const result = db.prepare(`
      DELETE FROM security_events 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `).run(parsedDays);
    return { deleted: result.changes, retention_days: parsedDays };
  } catch (e) {
    return { deleted: 0, error: e.message };
  }
}

export default {
  EVENT_SEVERITIES,
  sanitizeUrlForTelemetry,
  sanitizeSecurityDetails,
  getSafeClientIp,
  recordSecurityEvent,
  cleanupExpiredEvents
};
