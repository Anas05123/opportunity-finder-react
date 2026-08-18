/**
 * OWASP Security Middleware & Defense Utilities
 * - SSRF Protection (Private IP & Localhost Blocking)
 * - Prompt Injection Isolation
 * - Input Sanitization
 */

const BLOCKED_IP_PREFIXES = [
  '127.',
  '10.',
  '192.168.',
  '172.16.', '172.17.', '172.18.', '172.19.', '172.20.',
  '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
  '169.254.', // AWS / Cloud metadata service
  '0.0.0.0',
  'localhost'
];

/**
 * Validate URL to prevent SSRF vulnerabilities
 */
export function isSafeExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  try {
    const parsed = new URL(rawUrl);
    
    // Only allow HTTP/HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();

    // Block private IPs, localhost, and AWS metadata
    for (const prefix of BLOCKED_IP_PREFIXES) {
      if (host.startsWith(prefix) || host === prefix) {
        return false;
      }
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize untrusted external web text before sending to LLM
 * Shields against Prompt Injection attacks embedded in scraped HTML
 */
export function sanitizeUntrustedWebContent(text = '') {
  if (typeof text !== 'string') return '';

  return text
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[FILTERED_COMMAND]')
    .replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, '[FILTERED_COMMAND]')
    .replace(/system\s*:\s*/gi, 'Context:')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .slice(0, 3000); // Enforce strict length boundary
}
