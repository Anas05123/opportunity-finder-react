/**
 * High-Precision URL & Job Search Resolver
 * Eliminates over-specific query errors and dead links
 */

// Clean company and role into high-yielding 2-3 word search terms for LinkedIn & Job boards
export function cleanSearchTerms(organization = '', title = '') {
  let brand = (organization || '')
    .replace(/\(.*?\)/g, '') // remove parentheticals like (WPP), (Grab Holdings), (Alphabet Inc.)
    .replace(/Group|Headquarters|HQ|Malaysia|Berhad|Bhd|Inc\.|LLC|Corporation|The\s/gi, '')
    .trim();
  if (!brand) brand = organization.split(' ')[0] || 'Company';

  let role = (title || '')
    .replace(/[0-9]{4}/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/Global|The Complete Banker™|NextGen|Residency|Traineeship|Trainee|Summer|Analyst/gi, '')
    .replace(new RegExp(brand, 'gi'), '') // remove redundant company name from title
    .trim();

  const words = role.split(/\s+/).filter(w => w.length > 2).slice(0, 2).join(' ');
  const cleanRole = words || 'Internship';

  return {
    brand,
    role: cleanRole,
    searchQuery: `${brand} ${cleanRole}`.trim()
  };
}

/**
 * 1. Verified Official Corporate & Program Portals
 */
const KNOWN_PORTALS = {
  'ogilvy': 'https://www.ogilvy.com/careers',
  'google': 'https://careers.google.com/students/',
  'spotify': 'https://www.lifeatspotify.com/jobs',
  'loreal': 'https://careers.loreal.com/',
  'l’oréal': 'https://careers.loreal.com/',
  'publicis': 'https://careers.publicisgroupe.com/',
  'goldman': 'https://www.goldmansachs.com/careers/students/',
  'jpmorgan': 'https://careers.jpmorgan.com/global/en/students',
  'j.p. morgan': 'https://careers.jpmorgan.com/global/en/students',
  'morgan stanley': 'https://www.morganstanley.com/people-opportunities/students-graduates',
  'world bank': 'https://www.worldbank.org/en/about/careers/programs-and-internships',
  'blackrock': 'https://careers.blackrock.com/early-careers',
  'maybank': 'https://www.maybank.com/en/careers/students-graduates.page',
  'cimb': 'https://careers.cimb.com/',
  'grab': 'https://grab.careers/jobs/',
  'chevening': 'https://www.chevening.org/scholarships/',
  'daad': 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
  'mext': 'https://www.studyinjapan.go.jp/en/planning/scholarship/',
  'fulbright': 'https://foreign.fulbrightonline.org/',
  'erasmus': 'https://erasmus-plus.ec.europa.eu/'
};

export function resolveSafeJobUrl(op) {
  if (!op) return 'https://www.linkedin.com/jobs';

  const orgLower = (op.organization || '').toLowerCase();

  // 1. Direct Known Verified Corporate Portals
  for (const [key, portalUrl] of Object.entries(KNOWN_PORTALS)) {
    if (orgLower.includes(key)) {
      return portalUrl;
    }
  }

  // 2. Real external portal if not a broken LinkedIn view link
  const raw = op.official_program_url || op.official_apply_url || '';
  if (raw && !raw.includes('linkedin.com/jobs/view/') && raw.startsWith('http')) {
    return raw;
  }

  // 3. Fallback: Cleaned LinkedIn search URL
  return resolveLinkedInSearchUrl(op);
}

export function resolveLinkedInSearchUrl(op) {
  if (!op) return 'https://www.linkedin.com/jobs';
  const { searchQuery } = cleanSearchTerms(op.organization, op.title);
  
  // Clean location (prefer Country/City, avoid overly narrow street addresses like 'Pudu')
  let loc = (op.location_country || op.location_city || 'Malaysia').trim();
  if (loc.includes('Malaysia') || loc.includes('Kuala Lumpur')) loc = 'Malaysia';

  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(loc)}`;
}

export function resolveGoogleJobsUrl(op) {
  if (!op) return 'https://www.google.com/search?q=jobs';
  const { searchQuery } = cleanSearchTerms(op.organization, op.title);
  const loc = op.location_country || 'Malaysia';
  return `https://www.google.com/search?q=${encodeURIComponent(`${searchQuery} jobs in ${loc}`)}&ibp=htl;jobs`;
}
