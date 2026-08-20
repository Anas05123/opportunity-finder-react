/**
 * Universal Text & HTML Sanitizer
 * Decodes HTML entities, converts markup into clean readable Markdown/text,
 * and extracts salary/compensation patterns from unstructured job descriptions.
 */

export function decodeHtmlEntities(str = '') {
  if (!str) return '';
  let text = String(str);

  // Common named entities
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

  // Decode double-encoded entities iteratively (up to 3 passes)
  for (let pass = 0; pass < 3; pass++) {
    const prev = text;
    for (const [entity, char] of Object.entries(entityMap)) {
      text = text.replaceAll(entity, char);
    }
    // Numeric entities (decimal: &#160; / hex: &#xA0;)
    text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
    text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    if (text === prev) break;
  }

  return text;
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

  // Patterns like:
  // "$190,800 — $267,100 USD"
  // "base salary range for this position is: $190,800 - $267,100"
  // "RM 1,500 - RM 2,500 / month"
  // "$150,000 - $180,000 / year"
  // "£50,000 - £65,000"
  // "€45,000 - €60,000"
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

export default { decodeHtmlEntities, sanitizeHtmlToText, extractSalaryFromText };
