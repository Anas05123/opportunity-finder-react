/**
 * Robust text and stipend sanitization utility for Careerly
 */

export function cleanHtmlText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  
  let text = raw;
  // Decode HTML entities
  text = text
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text;
}

export function cleanStipendText(raw) {
  if (!raw || typeof raw !== 'string') return 'Compensation not disclosed';

  const cleaned = cleanHtmlText(raw);

  // Check if string is empty, corrupted, or contains html debris
  if (
    !cleaned ||
    cleaned.length < 2 ||
    cleaned.toLowerCase() === 'null' ||
    cleaned.toLowerCase() === 'undefined' ||
    cleaned.includes('class=') ||
    cleaned.includes('pay-range') ||
    cleaned.includes('div') && cleaned.length < 10
  ) {
    return 'Compensation not disclosed';
  }

  // If text contains valid numbers or keywords, format cleanly
  return cleaned;
}
