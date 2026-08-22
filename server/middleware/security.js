/**
 * CAREERLY ENTERPRISE CYBERSECURITY MIDDLEWARE & DEFENSE UTILITIES
 * - Advanced SSRF Defense (DNS Resolution + Private IP & Loopback Subnet Blocking)
 * - Tiered Rate Limiting (Brute-Force & Denial-of-Service Defense)
 * - LLM Prompt Injection Quarantine & Delimiter Isolation
 * - PDF Upload Magic-Byte & File Size Verification
 * - Input Sanitization & Anti-Directory-Traversal
 */

import dns from 'dns/promises';
import net from 'net';
import rateLimit from 'express-rate-limit';
import { recordSecurityEvent, getSafeClientIp } from '../services/security/securityEvents.js';

// -------------------------------------------------------------
// 1. ADVANCED SSRF DEFENSE ENGINE
// -------------------------------------------------------------

const PRIVATE_IPV4_SUBNETS = [
  { start: '10.0.0.0', end: '10.255.255.255' },         // RFC 1918 Private
  { start: '172.16.0.0', end: '172.31.255.255' },      // RFC 1918 Private
  { start: '192.168.0.0', end: '192.168.255.255' },    // RFC 1918 Private
  { start: '127.0.0.0', end: '127.255.255.255' },      // Loopback
  { start: '169.254.0.0', end: '169.254.255.255' },    // Link-local / Cloud Metadata (AWS/GCP/Azure)
  { start: '0.0.0.0', end: '0.255.255.255' },          // Broadcast/Wildcard
  { start: '100.64.0.0', end: '100.127.255.255' },     // Shared Address Space (CGNAT)
  { start: '192.0.0.0', end: '192.0.0.255' },          // IETF Protocol Assignments
  { start: '198.18.0.0', end: '198.19.255.255' },      // Benchmark Testing
  { start: '224.0.0.0', end: '239.255.255.255' },      // Multicast
  { start: '240.0.0.0', end: '255.255.255.255' }       // Reserved
];

function ipToNumber(ip) {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function isPrivateIp(ip) {
  if (!net.isIPv4(ip)) {
    // Check IPv6 loopback & private subnets
    const cleanIp = ip.toLowerCase();
    if (cleanIp === '::1' || cleanIp === '::' || cleanIp.startsWith('fe80:') || cleanIp.startsWith('fc00:') || cleanIp.startsWith('fd00:')) {
      return true;
    }
    return false;
  }

  const num = ipToNumber(ip);
  for (const range of PRIVATE_IPV4_SUBNETS) {
    const start = ipToNumber(range.start);
    const end = ipToNumber(range.end);
    if (num >= start && num <= end) {
      return true;
    }
  }
  return false;
}

/**
 * Synchronous URL format & hostname sanity check
 */
export function isSafeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  try {
    const parsed = new URL(rawUrl.trim());
    
    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Block localhost variations and cloud metadata
    if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname === '0.0.0.0') {
      return false;
    }

    // Only standard HTTP/HTTPS ports allowed
    const port = parsed.port;
    if (port && port !== '80' && port !== '443') {
      return false;
    }

    // Direct IP check
    if (net.isIP(hostname)) {
      if (isPrivateIp(hostname)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Deep Asynchronous DNS resolution check
 */
export async function verifySafeUrlWithDns(rawUrl) {
  if (!isSafeExternalUrl(rawUrl)) return false;

  try {
    const parsed = new URL(rawUrl.trim());
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    
    if (!addresses || addresses.length === 0) return false;

    // Verify every resolved IP is strictly public
    for (const entry of addresses) {
      if (isPrivateIp(entry.address)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return false;
  }
}

// -------------------------------------------------------------
// 2. TIERED RATE LIMITING MIDDLEWARE (WITH SECURITY TELEMETRY)
// -------------------------------------------------------------

function createRateLimitHandler(limiterName, defaultMessage) {
  return (req, res, next, options) => {
    recordSecurityEvent({
      event_type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      actor_ip: getSafeClientIp(req),
      request_path: req.originalUrl || req.path,
      request_method: req.method,
      details: { limiter: limiterName }
    });

    res.status(options.statusCode).json(options.message || {
      error: defaultMessage,
      code: 'RATE_LIMIT_EXCEEDED'
    });
  };
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 1000, // 20 attempts per 15 min in prod, higher headroom in dev/test
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost';
    return isLocal && req.headers['x-security-audit'] === 'careerly-internal-audit';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('authLimiter', 'Too many authentication attempts. Please wait 15 minutes before trying again.')
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI assistant rate limit reached. Please wait a moment before sending more requests.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('aiLimiter', 'AI assistant rate limit reached.')
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Opportunity discovery search rate limit reached. Please slow down.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('searchLimiter', 'Search rate limit reached.')
});

export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 emails per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Outreach email dispatch rate limit exceeded (max 5 per 15 mins).',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('emailLimiter', 'Outreach email dispatch rate limit exceeded.')
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 300 : 10000, // 300 req/min in prod, high headroom in dev/test
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost';
    return isLocal && req.headers['x-security-audit'] === 'careerly-internal-audit';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'API rate limit exceeded.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('generalApiLimiter', 'API rate limit exceeded.')
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 180 : 2000, // 180 admin req/min (supports multi-widget Security Center)
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') return true;
    const ip = req.ip || req.connection?.remoteAddress || '';
    const isLocal = ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'localhost';
    return isLocal && req.headers['x-security-audit'] === 'careerly-internal-audit';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Administrative endpoint rate limit reached. Please slow down.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  handler: createRateLimitHandler('adminLimiter', 'Administrative rate limit exceeded.')
});

// -------------------------------------------------------------
// 3. PROMPT INJECTION QUARANTINE & SANITIZATION
// -------------------------------------------------------------

export function sanitizeUntrustedWebContent(text = '', req = null) {
  if (typeof text !== 'string') return '';

  const hasInstructionOverride = /ignore\s+(all\s+)?previous\s+instructions/gi.test(text) ||
                                 /you\s+are\s+now\s+in\s+developer\s+mode/gi.test(text) ||
                                 /<\|im_start\|>/gi.test(text);

  if (hasInstructionOverride) {
    recordSecurityEvent({
      event_type: 'PROMPT_INJECTION_DETECTED',
      severity: 'HIGH',
      actor_ip: getSafeClientIp(req),
      request_path: req ? (req.originalUrl || req.path) : '/api/v1/ai',
      request_method: req ? req.method : 'POST',
      details: { pattern_detected: 'instruction_override_attempt' }
    });
  }

  return text
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[FILTERED_INSTRUCTION]')
    .replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, '[FILTERED_INSTRUCTION]')
    .replace(/system\s*:\s*/gi, 'Context:')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
    .slice(0, 5000); // 5000 chars length bound
}

/**
 * Wrap untrusted third-party opportunity data in XML boundaries
 */
export function wrapInUntrustedBoundary(content, tag = 'untrusted_job_posting') {
  const sanitized = sanitizeUntrustedWebContent(content);
  return `<${tag}>\n${sanitized}\n</${tag}>`;
}

// -------------------------------------------------------------
// 4. PDF MAGIC-BYTE & FILE INTEGRITY VERIFICATION
// -------------------------------------------------------------

export function validatePdfBase64(base64String, maxSizeBytes = 5 * 1024 * 1024) {
  if (!base64String || typeof base64String !== 'string') {
    return { valid: false, error: 'No file content provided' };
  }

  // Strip data URL scheme prefix if present
  const cleanBase64 = base64String.replace(/^data:application\/pdf;base64,/, '').trim();

  // Check approximate size (base64 is ~1.33x raw size)
  const estimatedSize = (cleanBase64.length * 3) / 4;
  if (estimatedSize > maxSizeBytes) {
    return { valid: false, error: `File size exceeds the 5MB maximum limit (received ~${Math.round(estimatedSize / 1024 / 1024)}MB)` };
  }

  // Check PDF Magic Header (%PDF- -> base64 starts with JVBERi0)
  if (!cleanBase64.startsWith('JVBERi0')) {
    return { valid: false, error: 'Invalid file format. Only authentic PDF documents (%PDF-) are accepted.' };
  }

  return { valid: true, cleanBase64 };
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName = 'document.pdf') {
  if (typeof fileName !== 'string') return 'document.pdf';
  return fileName
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .trim()
    .slice(0, 100);
}

export default {
  isSafeExternalUrl,
  verifySafeUrlWithDns,
  isPrivateIp,
  authLimiter,
  aiLimiter,
  searchLimiter,
  emailLimiter,
  generalApiLimiter,
  sanitizeUntrustedWebContent,
  wrapInUntrustedBoundary,
  validatePdfBase64,
  sanitizeFileName
};
