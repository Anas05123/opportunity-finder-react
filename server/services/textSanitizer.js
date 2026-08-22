/**
 * Universal Text & HTML Sanitizer & XSS Defense Suite
 * Decodes HTML entities, converts markup into clean readable Markdown/text,
 * extracts salary/compensation patterns from unstructured job descriptions,
 * and eliminates reflected, stored, and DOM-based XSS vectors.
 */

export function decodeHtmlEntities(str = '') {
  if (!str) return '';
  let text = String(str);

  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
    '&bull;': '•',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };

  for (let pass = 0; pass < 3; pass++) {
    const prev = text;
    for (const [entity, char] of Object.entries(entityMap)) {
      text = text.replaceAll(entity, char);
    }
    text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (text === prev) break;
  }

  return text;
}

/**
 * Escapes characters with special meaning in HTML to prevent XSS.
 */
export function escapeHtml(str = '') {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;');
}

/**
 * Deep sanitization for untrusted user inputs (stored XSS defense)
 * Strips script tags, event handlers, javascript: pseudo-protocols, and unsafe elements
 */
export function sanitizeInputString(raw = '') {
  if (raw === null || raw === undefined) return '';
  if (typeof raw !== 'string') return String(raw);

  let clean = raw;

  // 1. Remove dangerous script, iframe, object, embed, style, svg, math, form tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  clean = clean.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  clean = clean.replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, '');

  // 2. Strip single/unclosed dangerous tags
  clean = clean.replace(/<\/?(?:script|iframe|object|embed|applet|meta|link|form|input|button|svg|math|base|marquee|body|head|html|applet|style)[^>]*>/gi, '');

  // 3. Remove inline event handlers (e.g. onload=, onerror=, onclick=, onmouseover=, onfocus=, onblur=, onanimationstart=)
  clean = clean.replace(/\bon[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 4. Remove dangerous URI schemes (javascript:, vbscript:, data:text/html, data:text/javascript)
  clean = clean.replace(/(?:javascript|vbscript|data\s*:\s*text\/(?:html|javascript))\s*:/gi, 'blocked:');

  return clean.trim();
}

/**
 * Recursively sanitizes every string property of an object or array.
 */
export function sanitizeObject(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return sanitizeInputString(data);
  if (Array.isArray(data)) return data.map(item => sanitizeObject(item));
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return data;
}

/**
 * WHATWG-compliant URL validation: only permits http://, https://, mailto:, tel:
 */
export function sanitizeSafeUrl(rawUrl, fallback = null) {
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;

  // 1. Strip control chars, null bytes, zero-width chars, whitespace
  let clean = rawUrl
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    .trim();

  if (!clean) return fallback;

  // 2. Multi-pass decoding
  let decoded = clean;
  for (let pass = 0; pass < 3; pass++) {
    const prev = decoded;
    decoded = decoded
      .replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&colon;/gi, ':')
      .replace(/&tab;/gi, '')
      .replace(/&newline;/gi, '');
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      // ignore
    }
    decoded = decoded.replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '');
    if (decoded === prev) break;
  }

  const normalizedLower = decoded.toLowerCase();

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

  if (clean.startsWith('//') || clean.startsWith('\\\\') || clean.startsWith('\\/') || clean.startsWith('/\\')) {
    return fallback;
  }

  if (clean.startsWith('#') || (clean.startsWith('/') && !clean.startsWith('//'))) {
    return clean;
  }

  try {
    const targetUrl = (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('mailto:') || clean.startsWith('tel:'))
      ? clean
      : `https://${clean}`;

    const parsed = new URL(targetUrl);
    const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!SAFE_PROTOCOLS.includes(parsed.protocol)) {
      return fallback;
    }
    return parsed.href;
  } catch {
    return fallback;
  }
}

export function sanitizeHtmlToText(rawHtml = '') {
  if (!rawHtml) return '';
  
  // Step 1: Decode entities
  let text = decodeHtmlEntities(rawHtml);

  // Step 2: Convert headers and block structures to markdown/line breaks
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n### $1\n\n');
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|section|article|header|tr)>/gi, '\n\n');
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Step 3: Strip any remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Step 4: Clean whitespace and collapse redundant line breaks
  text = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n\n');

  return text.trim();
}

/**
 * Extract salary/compensation range from raw job text if not provided in metadata
 */
export function extractSalaryFromText(text = '') {
  if (!text) return null;

  const patterns = [
    /(\$\s*[\d,]+(?:\.\d+)?\s*(?:—|-|to)\s*\$\s*[\d,]+(?:\.\d+)?(?:\s*(?:USD|CAD|AUD))?(?:\s*(?:\/|\s+per\s+)(?:year|yr|month|mo|hr|hour))?)/i,
    /((?:RM|MYR)\s*[\d,]+(?:\.\d+)?\s*(?:—|-|to)\s*(?:RM|MYR)?\s*[\d,]+(?:\.\d+)?(?:\s*(?:\/|\s+per\s+)(?:month|mo|year|yr))?)/i,
    /(£\s*[\d,]+(?:\.\d+)?\s*(?:—|-|to)\s*£?\s*[\d,]+(?:\.\d+)?(?:\s*(?:\/|\s+per\s+)(?:year|yr|month|mo))?)/i,
    /(€\s*[\d,]+(?:\.\d+)?\s*(?:—|-|to)\s*€?\s*[\d,]+(?:\.\d+)?(?:\s*(?:\/|\s+per\s+)(?:year|yr|month|mo))?)/i,
    /base salary range[^:\n]*:\s*([^\n\r<]{5,50})/i,
    /salary range[^:\n]*:\s*([^\n\r<]{5,50})/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleaned.length >= 4 && cleaned.length <= 60 && !cleaned.toLowerCase().includes('competitive')) {
        return cleaned;
      }
    }
  }

  return null;
}

/**
 * Universal Stipend Sanitizer that removes unescaped HTML entities and extracts valid salary
 */
export function sanitizeStipendField(rawStipend, rawDescription) {
  if (rawStipend) {
    let cleaned = decodeHtmlEntities(rawStipend);
    cleaned = cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/class=[^\s]+/gi, '').replace(/pay-range/gi, '').trim();

    if (cleaned && cleaned.length >= 2 && (/\d|\$|RM|€|£|USD|MYR|funded/i.test(cleaned) || cleaned.toLowerCase().includes('paid'))) {
      return cleaned;
    }
  }

  if (rawDescription) {
    const extracted = extractSalaryFromText(decodeHtmlEntities(rawDescription));
    if (extracted) return extracted;
  }

  return null;
}

export default { 
  decodeHtmlEntities, 
  escapeHtml, 
  sanitizeInputString, 
  sanitizeObject, 
  sanitizeSafeUrl, 
  sanitizeHtmlToText, 
  extractSalaryFromText, 
  sanitizeStipendField 
};
