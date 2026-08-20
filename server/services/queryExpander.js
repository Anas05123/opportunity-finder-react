/**
 * Deterministic Query Expander (V4)
 * Generates controlled, semantically relevant search queries from compiled user search intent.
 * Prevents uncontrolled semantic drift while maximizing recall across ATS feeds and search providers.
 */

export const ROLE_SYNONYMS = {
  DIGITAL_MARKETING: [
    'Digital Marketing Specialist',
    'Digital Marketing Executive',
    'Digital Marketing Associate',
    'Performance Marketing Specialist',
    'Growth Marketing Specialist',
    'Digital Marketing Coordinator',
    'Content Marketing Specialist',
    'Social Media Marketing Specialist',
    'Digital Marketer',
    'Marketing Specialist'
  ],
  DIGITAL_MARKETING_INTERN: [
    'Digital Marketing Intern',
    'Marketing Intern',
    'Digital Marketing Internship',
    'Performance Marketing Intern',
    'Growth Marketing Intern',
    'Social Media Intern',
    'Content Marketing Intern'
  ],
  ADVERTISING_CREATIVE: [
    'Advertising Specialist',
    'Creative Strategist',
    'Copywriter',
    'Art Director',
    'Account Planner',
    'Media Planner',
    'Advertising Executive'
  ],
  ADVERTISING_INTERN: [
    'Advertising Intern',
    'Creative Intern',
    'Copywriting Intern',
    'Art Direction Intern',
    'Account Planning Intern'
  ],
  SOFTWARE_ENGINEERING: [
    'Software Engineer',
    'Backend Engineer',
    'Frontend Engineer',
    'Full Stack Developer',
    'Software Developer',
    'DevOps Engineer',
    'Mobile Developer',
    'Web Developer'
  ],
  SOFTWARE_INTERN: [
    'Software Engineering Intern',
    'SWE Intern',
    'Software Development Intern',
    'Developer Intern',
    'Backend Intern',
    'Frontend Intern'
  ],
  FINANCE_ACCOUNTING: [
    'Financial Analyst',
    'Investment Analyst',
    'Finance Specialist',
    'Accountant',
    'Auditor'
  ],
  FINANCE_INTERN: [
    'Finance Intern',
    'Accounting Intern',
    'Investment Banking Intern',
    'Audit Intern'
  ]
};

export function expandSearchProfile(compiledConstraints = {}) {
  const predicates = compiledConstraints.predicates || {};
  const rawQuery = (compiledConstraints.raw_query || '').toLowerCase().trim();
  const roleRelevance = predicates.role_relevance || {};
  const targetFamily = roleRelevance.target_role_family || 'OTHER';
  const isInternship = predicates.allowed_types?.includes('internship') && !predicates.allowed_types?.includes('job');
  const loc = predicates.location || {};
  const locationMode = loc.mode || 'METRO_RADIUS';
  const locationSuffix = locationMode === 'ANYWHERE' ? '' : (loc.target_city || loc.target_country || '');

  let baseRoles = [];

  if (targetFamily === 'DIGITAL_MARKETING') {
    baseRoles = isInternship ? ROLE_SYNONYMS.DIGITAL_MARKETING_INTERN : ROLE_SYNONYMS.DIGITAL_MARKETING;
  } else if (targetFamily === 'ADVERTISING_CREATIVE') {
    baseRoles = isInternship ? ROLE_SYNONYMS.ADVERTISING_INTERN : ROLE_SYNONYMS.ADVERTISING_CREATIVE;
  } else if (targetFamily === 'SOFTWARE_ENGINEERING') {
    baseRoles = isInternship ? ROLE_SYNONYMS.SOFTWARE_INTERN : ROLE_SYNONYMS.SOFTWARE_ENGINEERING;
  } else if (targetFamily === 'FINANCE_ACCOUNTING') {
    baseRoles = isInternship ? ROLE_SYNONYMS.FINANCE_INTERN : ROLE_SYNONYMS.FINANCE_ACCOUNTING;
  } else {
    // Extract key nouns from raw query
    const cleaned = rawQuery.replace(/i want|find me|looking for|a job|an internship|in|at|anywhere|please/gi, '').trim();
    baseRoles = [cleaned || 'opportunity'];
  }

  // Generate expanded queries with location (if specified)
  const queries = baseRoles.map(role => {
    if (locationSuffix && locationSuffix !== 'Anywhere' && locationSuffix !== 'Worldwide') {
      return `"${role}" ${locationSuffix}`.trim();
    }
    return `"${role}"`.trim();
  });

  return {
    target_role_family: targetFamily,
    is_internship: isInternship,
    location_mode: locationMode,
    location_suffix: locationSuffix,
    expanded_titles: baseRoles,
    queries: Array.from(new Set(queries)).slice(0, 8)
  };
}

export default { expandSearchProfile, ROLE_SYNONYMS };
