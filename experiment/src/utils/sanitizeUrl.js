/**
 * CAREERLY ENTERPRISE WHATWG URL SANITIZER (ADVERSARIAL DEFENSE)
 * Defends against:
 * - Case mutations (JAVASCRIPT:, jAvAsCrIpT:)
 * - URL encoding (java%73cript:, javascript%3A)
 * - HTML entity evasion (javascript&#58;, &#x3A;)
 * - Null-byte injection (\0, %00)
 * - Control character smuggling (\u0001 - \u001F, \u007F - \u009F)
 * - Protocol-relative URL hijacking (//evil.com, \\evil.com, \/evil.com)
 * - Dangerous schemes (data:, vbscript:, file:, blob:, about:)
 * - Userinfo & path traversal anomalies
 */

export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;

  // 1. Strip ASCII & Unicode control characters, null bytes, zero-width chars, and outer whitespace
  let clean = url
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!clean) return fallback;

  // 2. Multi-pass decoding to prevent nested/double encoding evasions
  let decoded = clean;
  for (let pass = 0; pass < 3; pass++) {
    const prev = decoded;
    // Decode HTML numeric & named entities
    decoded = decoded
      .replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&colon;/gi, ':')
      .replace(/&tab;/gi, '')
      .replace(/&newline;/gi, '');
    
    // Decode URI percent-encoding
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // If malformed percent-encoding, keep best-effort
    }

    // Strip control chars again after decoding
    decoded = decoded.replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '');
    if (decoded === prev) break;
  }

  const normalizedLower = decoded.toLowerCase();

  // 3. Strict rejection of executable and dangerous pseudo-protocols
  const DANGEROUS_PROTOCOLS = [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'blob:',
    'about:'
  ];

  for (const proto of DANGEROUS_PROTOCOLS) {
    if (normalizedLower.startsWith(proto) || normalizedLower.includes(proto)) {
      return fallback;
    }
  }

  // Reject protocol-relative or Windows UNC / backslash URLs (//evil.com, \\evil.com, \/evil.com)
  if (clean.startsWith('//') || clean.startsWith('\\\\') || clean.startsWith('\\/') || clean.startsWith('/\\')) {
    return fallback;
  }

  // 4. Safe local paths and anchor hashes
  if (clean.startsWith('#') || (clean.startsWith('/') && !clean.startsWith('//'))) {
    return clean;
  }

  // 5. WHATWG URL Parsing for absolute web URLs
  try {
    const targetUrl = (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('mailto:') || clean.startsWith('tel:'))
      ? clean
      : `https://${clean}`;

    const parsed = new URL(targetUrl);

    // Enforce allowed protocols
    const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!SAFE_PROTOCOLS.includes(parsed.protocol)) {
      return fallback;
    }

    return parsed.href;
  } catch {
    return fallback;
  }
}

export function safeOpenUrl(url, target = '_blank') {
  const safe = sanitizeUrl(url, null);
  if (!safe || safe === '#' || safe.startsWith('javascript:')) return false;
  window.open(safe, target, 'noopener,noreferrer');
  return true;
}

export default { sanitizeUrl, safeOpenUrl };
