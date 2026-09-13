/**
 * Instagram Opportunity Extractor - Core Parser & Normalizer
 * Pure parsing module for converting raw caption and OCR text into structured opportunity JSON.
 */

// Supported Opportunity Types
export const OPPORTUNITY_TYPES = [
  'Internship',
  'Scholarship',
  'Fellowship',
  'Job',
  'Research Opportunity',
  'Competition',
  'Grant',
  'Workshop',
  'Conference',
  'Exchange Program',
  'Volunteering'
];

/**
 * Validate Instagram Post URL format
 */
export function validateInstagramUrl(url = '') {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string' };
  }

  const trimmed = url.trim();
  const igRegex = /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i;
  const match = trimmed.match(igRegex);

  if (!match) {
    // Check if it's a general profile or invalid link
    if (/instagram\.com\/[A-Za-z0-9_.]+\/?$/i.test(trimmed)) {
      return { isValid: false, error: 'Bulk profile URLs are not supported. Provide a specific post URL (e.g. /p/<ID>/ or /reel/<ID>/).' };
    }
    return { isValid: false, error: 'Invalid Instagram post URL format. Expected: https://www.instagram.com/p/<POST_ID>/' };
  }

  const postType = match[1].toLowerCase();
  const postId = match[2];
  const canonicalUrl = `https://www.instagram.com/${postType}/${postId}/`;

  return {
    isValid: true,
    postType,
    postId,
    canonicalUrl
  };
}

/**
 * Normalize human-readable dates into ISO format (YYYY-MM-DD)
 */
export function normalizeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const cleaned = dateStr
    .replace(/(?:st|nd|rd|th)/gi, '') // 27th -> 27
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. ISO format (YYYY-MM-DD)
  const isoMatch = cleaned.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Format: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = cleaned.match(/\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Named month formats (e.g., "November 27 2026", "27 Nov 2026", "Nov 27 2026")
  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  const monthNamesPattern = Object.keys(months).join('|');

  // "November 27 2026" or "Nov 27 2026"
  const mdyRegex = new RegExp(`\\b(${monthNamesPattern})\\s+(0?[1-9]|[12]\\d|3[01])(?:\\s+(20\\d{2}))?\\b`, 'i');
  const mdyMatch = cleaned.match(mdyRegex);
  if (mdyMatch) {
    const m = months[mdyMatch[1].toLowerCase()];
    const d = mdyMatch[2].padStart(2, '0');
    const currentYear = new Date().getFullYear();
    const y = mdyMatch[3] || String(currentYear);
    return `${y}-${m}-${d}`;
  }

  // "27 November 2026" or "27 Nov 2026"
  const dmyNamedRegex = new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s+(${monthNamesPattern})(?:\\s+(20\\d{2}))?\\b`, 'i');
  const dmyNamedMatch = cleaned.match(dmyNamedRegex);
  if (dmyNamedMatch) {
    const d = dmyNamedMatch[1].padStart(2, '0');
    const m = months[dmyNamedMatch[2].toLowerCase()];
    const currentYear = new Date().getFullYear();
    const y = dmyNamedMatch[3] || String(currentYear);
    return `${y}-${m}-${d}`;
  }

  // Standard JS Date fallback parse
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    const dateObj = new Date(parsed);
    const y = dateObj.getFullYear();
    if (y >= 2020 && y <= 2035) {
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Classify Opportunity Type from text
 */
export function classifyOpportunityType(text = '') {
  const lower = text.toLowerCase();

  if (/\b(internship|internships|summer intern|fall intern|spring intern|co-op|coop)\b/i.test(lower)) {
    return 'Internship';
  }
  if (/\b(scholarship|scholarships|fully funded scholarship|tuition waiver|study grant)\b/i.test(lower)) {
    return 'Scholarship';
  }
  if (/\b(fellowship|fellowships|fellow|postdoctoral fellowship)\b/i.test(lower)) {
    return 'Fellowship';
  }
  if (/\b(research opportunity|student researcher|research assistant|phd position|lab researcher)\b/i.test(lower)) {
    return 'Research Opportunity';
  }
  if (/\b(grant|grants|funding opportunity|financial award)\b/i.test(lower)) {
    return 'Grant';
  }
  if (/\b(competition|hackathon|challenge|contest|prize|awards)\b/i.test(lower)) {
    return 'Competition';
  }
  if (/\b(exchange program|cultural exchange|study abroad|erasmus|semester abroad)\b/i.test(lower)) {
    return 'Exchange Program';
  }
  if (/\b(workshop|training program|bootcamp|masterclass|course)\b/i.test(lower)) {
    return 'Workshop';
  }
  if (/\b(conference|summit|symposium|forum|youth summit)\b/i.test(lower)) {
    return 'Conference';
  }
  if (/\b(job|hiring|full-time|part-time|employment|vacancy|career opportunity|software engineer|manager)\b/i.test(lower)) {
    return 'Job';
  }

  return null;
}

/**
 * Extract Organization / Host Entity from text
 */
export function extractOrganization(text = '', fallbackAccount = null) {
  if (!text) return fallbackAccount || null;

  // Prominent known global organizations/companies
  const knownOrgs = [
    'Google', 'Microsoft', 'Apple', 'Meta', 'Amazon', 'OpenAI', 'NVIDIA', 'Netflix',
    'Stripe', 'Spotify', 'Tesla', 'Twitter', 'X', 'Adobe', 'Uber', 'Airbnb',
    'United Nations', 'UN', 'UNESCO', 'UNICEF', 'WHO', 'World Bank', 'IMF',
    'DAAD', 'Fulbright', 'Chevening', 'Erasmus', 'Erasmus+', 'CERN', 'ESA', 'NASA',
    'McKinsey', 'BCG', 'Bain', 'Goldman Sachs', 'Morgan Stanley', 'JPMorgan',
    'Harvard', 'MIT', 'Stanford', 'Oxford', 'Cambridge', 'ETH Zurich', 'KAUST'
  ];

  for (const org of knownOrgs) {
    const reg = new RegExp(`\\b${org.replace('+', '\\+')}\\b`, 'i');
    if (reg.test(text)) {
      return org;
    }
  }

  // Regex patterns: "at <Company>", "with <Company>", "by <Company>", "<Company> invites", "<Company> is offering"
  const orgPatterns = [
    /(?:opportunity|internship|scholarship|fellowship|job|program|position)\s+(?:at|with|by|from)\s+([A-Z][A-Za-z0-9\s&.-]{2,30}?)(?:\n|\.|\s+in|\s+for|\s+benefits|\s+deadline|,)/i,
    /([A-Z][A-Za-z0-9\s&.-]{2,30}?)\s+(?:is hiring|is offering|presents|launches|invites applications|announces)/i,
    /^(?:🏢|🏛️|Organized by:|Host Institution:|Company:)\s*([A-Za-z0-9\s&.-]{2,30})/im
  ];

  for (const pattern of orgPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 35 && !/^(the|this|an|a|our|new)$/i.test(candidate)) {
        return candidate;
      }
    }
  }

  if (fallbackAccount && typeof fallbackAccount === 'string') {
    const cleanAccount = fallbackAccount.replace(/^@/, '').trim();
    if (cleanAccount.length > 1) {
      return cleanAccount.charAt(0).toUpperCase() + cleanAccount.slice(1);
    }
  }

  return null;
}

/**
 * Extract Title from caption / OCR text
 */
export function extractTitle(caption = '', ocrText = '', opportunityType = null, organization = null) {
  const combined = (caption || ocrText || '').trim();
  if (!combined) return null;

  const lines = combined.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Look for explicit title line (first 1-3 lines that contain opportunity keywords)
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i];
    // Ignore pure social hashtags or short emoji lines
    if (/^#[A-Za-z0-9_]+(\s+#[A-Za-z0-9_]+)*$/.test(line)) continue;
    if (line.length < 5) continue;

    // Check if line mentions internship, scholarship, fellowship, or year 202X
    if (/(?:internship|scholarship|fellowship|program|opportunity|researcher|fellow|grant|competition|202\d)/i.test(line)) {
      // Clean leading emoji & labels
      return line.replace(/^[^a-zA-Z0-9]+/, '').replace(/^(?:Title|Opportunity|Program):\s*/i, '').trim();
    }
  }

  // 2. Fallback to first non-empty substantial line
  if (lines.length > 0 && lines[0].length >= 8 && lines[0].length <= 120) {
    return lines[0].replace(/^[^a-zA-Z0-9]+/, '').trim();
  }

  // 3. Synthetic fallback if type & org exist
  if (organization && opportunityType) {
    return `${organization} ${opportunityType} 2026`;
  }

  return lines[0] || null;
}

/**
 * Extract Location
 */
export function extractLocation(text = "") {
  if (!text) return null;

  // 1. Explicit labeled location: "Location: Germany", "📍 Geneva, Switzerland", "Host Country: USA"
  const locMatch = text.match(/(?:📍|🌍|🌎|🌏|Location|Country|Place|Host Country|Where):\s*([^\n\r,•]+)/i);
  if (locMatch && locMatch[1]) {
    const loc = locMatch[1].trim();
    if (loc.length > 1 && loc.length < 50) return loc;
  }

  // 2. Specific City / Country mentions: "in the USA", "in Geneva, Switzerland", "in Germany"
  const commonLocations = [
    "Geneva, Switzerland", "Switzerland", "USA", "United States", "UK", "United Kingdom",
    "Canada", "Germany", "France", "Australia", "Netherlands", "Japan", "Singapore",
    "Sweden", "Norway", "Denmark", "Austria", "Italy", "Spain", "Saudi Arabia", "UAE",
    "Qatar", "South Korea", "China", "India", "Brazil", "South Africa", "Europe"
  ];

  for (const loc of commonLocations) {
    const escaped = loc.replace(",", "\\s*,?");
    const reg = new RegExp(`\\b(?:in the|in|at|to|hosted in)\\s+(${escaped})\\b`, "i");
    const m = text.match(reg);
    if (m && m[1]) return loc.includes("Geneva") ? "Switzerland" : (loc === "United States" ? "USA" : loc);
  }

  // 3. Fallback to Remote / Online / Worldwide only if not part of eligibility ("students worldwide")
  if (/\b(remote|online|virtual|work from home)\b/i.test(text)) {
    if (/\b(remote)\b/i.test(text)) return "Remote";
    if (/\b(online|virtual)\b/i.test(text)) return "Online";
  }

  if (/\b(worldwide|global)\b/i.test(text) && !/\b(?:students|graduates|applicants|open to|eligibility|eligible)\s+(?:worldwide|globally)\b/i.test(text)) {
    return "Global / Worldwide";
  }

  return null;
}

export function extractEligibility(text = '') {
  if (!text) return null;

  // Explicit eligibility pattern
  const eligMatch = text.match(/(?:🎯|🎓|Eligibility|Requirements|Who can apply|Eligible nationalities|Target Audience):\s*([^\n\r]+)/i);
  if (eligMatch && eligMatch[1]) {
    const elig = eligMatch[1].trim();
    if (elig.length > 2) return elig;
  }

  // Common eligibility patterns in text
  const patterns = [
    /\b(students worldwide|international students|all nationalities|open to all|undergraduate and master's|phd candidates|recent graduates|high school students)\b/i,
    /\b(eligible:\s*[^\n.]+)/i
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1).trim();
    }
  }

  return null;
}

/**
 * Extract Deadline with normalization
 */
export function extractDeadline(text = '') {
  if (!text) return null;

  // Match patterns like "Deadline: November 27, 2026", "Closing date: 2026-11-27", "Apply by: 15 Dec"
  const deadlinePatterns = [
    /(?:⏰|📅|⌛|Deadline|Application Deadline|Closing Date|Apply Before|Last Date|Due Date):\s*([^\n\r]+)/i,
    /(?:deadline is|closes on|apply by)\s+([A-Za-z0-9,\s.-]{4,25})/i
  ];

  for (const p of deadlinePatterns) {
    const match = text.match(p);
    if (match && match[1]) {
      const rawDateStr = match[1].trim();
      const normalized = normalizeDate(rawDateStr);
      if (normalized) return normalized;
    }
  }

  // Generic date scan if keyword "deadline" or "due" is nearby
  const genericMatch = text.match(/(?:deadline|closing)\s*[:\s-]*([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Za-z]+ \d{4}|\d{4}[-/]\d{2}[-/]\d{2})/i);
  if (genericMatch && genericMatch[1]) {
    const normalized = normalizeDate(genericMatch[1]);
    if (normalized) return normalized;
  }

  return null;
}

/**
 * Extract Benefits list
 */
export function extractBenefits(text = '') {
  if (!text) return [];

  const benefits = [];

  // 1. Look for Benefits section with bullet points
  const benefitsSectionMatch = text.match(/(?:✨|🎁|💰|Benefits|Perks|What you get|Coverage|What's included|Offer):\s*([\s\S]*?)(?:\n\s*\n|Deadline|Eligibility|Location|Apply|How to apply|$)/i);
  
  if (benefitsSectionMatch && benefitsSectionMatch[1]) {
    const sectionText = benefitsSectionMatch[1];
    const lines = sectionText.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
      // Check for bullet markers: •, -, *, 1., 2., ✓, ✔
      const cleaned = line.replace(/^[•\-*✓✔\d\.\)]\s*/, '').trim();
      if (cleaned.length > 5 && cleaned.length < 150 && !/^(deadline|eligibility|location|how to apply)/i.test(cleaned)) {
        benefits.push(cleaned);
      }
    }
  }

  // 2. Individual benefit keyword mentions if no bullet section found
  if (benefits.length === 0) {
    const keywords = [
      /(?:fully funded|partially funded|full tuition coverage)/i,
      /(?:monthly stipend|living allowance|stipend provided|\$\d+[\d,]*\s*(?:per month|\/month|stipend)?)/i,
      /(?:airfare coverage|flight tickets provided|travel grant|travel allowance)/i,
      /(?:health insurance|accommodation provided|free housing)/i,
      /(?:no application fee|certificate provided|mentorship opportunity)/i
    ];

    for (const kw of keywords) {
      const match = text.match(kw);
      if (match) {
        const item = match[0].charAt(0).toUpperCase() + match[0].slice(1).trim();
        if (!benefits.includes(item)) benefits.push(item);
      }
    }
  }

  return benefits;
}

/**
 * Extract Application URL and Instructions
 */
export function extractApplicationDetails(text = '') {
  let application_url = null;
  let application_instructions = null;

  if (!text) return { application_url, application_instructions };

  // 1. Check for explicit URLs in text
  const urlMatch = text.match(/https?:\/\/(?:www\.)?[a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/i);
  if (urlMatch && !urlMatch[0].includes('instagram.com/p/')) {
    application_url = urlMatch[0];
  }

  // 2. Check for typical Instagram application instructions
  const instructionPatterns = [
    /(?:🔗|Apply:|Application:|Link:)\s*([^\n\r]+)/i,
    /(?:link\s+(?:is\s+)?available in\s+(?:our\s+)?(?:story|highlights|bio|profile)[^\n.]*)/i,
    /(?:link in (?:bio|profile)[^\n.]*)/i,
    /(?:apply via link in (?:bio|story)[^\n.]*)/i,
    /(?:send (?:your )?cv to [^\n\s]+@[^\n\s]+)/i,
    /(?:dm us for the application link[^\n.]*)/i
  ];

  for (const p of instructionPatterns) {
    const match = text.match(p);
    if (match) {
      application_instructions = match[0].replace(/^[🔗\s]+/, '').trim();
      break;
    }
  }

  return { application_url, application_instructions };
}

/**
 * Extract Source Account (e.g., @username)
 */
export function extractSourceAccount(text = '', fallbackAccount = null) {
  if (fallbackAccount) return fallbackAccount.startsWith('@') ? fallbackAccount : `@${fallbackAccount}`;

  const match = text.match(/(?:posted by|credit|via|source|account):\s*(@[A-Za-z0-9_.]+)/i) || text.match(/(@[A-Za-z0-9_.]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Main Pipeline Parser
 * Takes raw caption, OCR text, and metadata, and returns a fully normalized Opportunity JSON object.
 */
export function parseOpportunity({
  rawCaption = null,
  rawOcrText = null,
  sourceUrl = '',
  sourceAccount = null,
  postImage = null
}) {
  const caption = (rawCaption || '').trim();
  const ocr = (rawOcrText || '').trim();
  const combinedText = `${caption}\n\n${ocr}`.trim();

  const opportunity_type = classifyOpportunityType(combinedText);
  const organization = extractOrganization(combinedText, sourceAccount);
  const title = extractTitle(caption, ocr, opportunity_type, organization);
  const location = extractLocation(combinedText);
  const eligibility = extractEligibility(combinedText);
  const deadline = extractDeadline(combinedText);
  const benefits = extractBenefits(combinedText);
  const { application_url, application_instructions } = extractApplicationDetails(combinedText);
  const extractedAccount = extractSourceAccount(combinedText, sourceAccount);

  const urlValidation = validateInstagramUrl(sourceUrl);
  const normalizedSourceUrl = urlValidation.isValid ? urlValidation.canonicalUrl : (sourceUrl || null);

  return {
    title: title || null,
    organization: organization || null,
    opportunity_type: opportunity_type || null,
    location: location || null,
    eligibility: eligibility || null,
    deadline: deadline || null,
    benefits: Array.isArray(benefits) ? benefits : [],
    application_url: application_url || null,
    application_instructions: application_instructions || null,
    source_platform: 'Instagram',
    source_account: extractedAccount || null,
    source_url: normalizedSourceUrl,
    raw_caption: caption || null,
    raw_ocr_text: ocr || null,
    extraction_timestamp: new Date().toISOString()
  };
}

export default {
  OPPORTUNITY_TYPES,
  validateInstagramUrl,
  normalizeDate,
  classifyOpportunityType,
  extractOrganization,
  extractTitle,
  extractLocation,
  extractEligibility,
  extractDeadline,
  extractBenefits,
  extractApplicationDetails,
  extractSourceAccount,
  parseOpportunity
};
