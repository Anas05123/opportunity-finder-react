/**
 * Deterministic Opportunity Type Classifier (V3/V4)
 * Strictly separates internships, full-time jobs, scholarships, and fellowships.
 * Uses strict word boundaries to prevent substring collisions (e.g. 'internal', 'international').
 */

export function classifyOpportunityType(title = '', description = '') {
  const t = (title || '').toLowerCase().trim();
  const d = (description || '').toLowerCase();

  // 1. Scholarships & Grants
  if (/\b(scholarships?|bursary|bursaries|grants?|financial aid)\b/i.test(t)) {
    return 'scholarship';
  }

  // 2. Fellowships
  if (/\b(fellowships?|fellow program)\b/i.test(t)) {
    return 'fellowship';
  }

  // 3. Internships & Traineeships (Strict word boundaries to never match 'internal', 'international', etc.)
  if (
    /\b(intern|interns|internship|internships|trainee|trainees|traineeship|traineeships|co-op|coop)\b/i.test(t) ||
    t.includes('industrial training') ||
    t.includes('practical training') ||
    /\b(internship program|traineeship program|industrial training)\b/i.test(d)
  ) {
    return 'internship';
  }

  // 4. Full-time / Standard Jobs
  return 'job';
}

export default { classifyOpportunityType };
