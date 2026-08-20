import { calculateJaroWinkler } from './deduplicator.js';

/**
 * Job-Identity Verifier (V3)
 * Ensures that when following an application link, the destination represents the SAME role and employer.
 */
export function verifyJobIdentity(discovered = {}, targetPage = {}) {
  const companyA = discovered.company_name || discovered.company || '';
  const companyB = targetPage.company_name || targetPage.company || '';
  const titleA = discovered.title || '';
  const titleB = targetPage.title || '';

  const companySim = calculateJaroWinkler(companyA, companyB);
  const titleSim = calculateJaroWinkler(titleA, titleB);

  const isCompanyMatch = companySim >= 0.85;
  const isTitleMatch = titleSim >= 0.80;

  let isJobIdMatch = null;
  if (discovered.job_id && targetPage.job_id) {
    isJobIdMatch = String(discovered.job_id).trim() === String(targetPage.job_id).trim();
  }

  const isMatch = isJobIdMatch === true || (isCompanyMatch && isTitleMatch);

  return {
    is_match: isMatch,
    is_identity_match: isMatch,
    confidence: isMatch ? (isJobIdMatch ? 1.0 : (companySim + titleSim) / 2) : 0.0,
    details: {
      company_similarity: companySim,
      title_similarity: titleSim,
      job_id_match: isJobIdMatch
    },
    mismatch_reason: isMatch ? null : 'Application destination refers to a different role or employer.'
  };
}

export default { verifyJobIdentity };
