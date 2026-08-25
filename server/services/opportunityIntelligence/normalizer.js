import { normalizeLocation } from '../locationNormalizer.js';
import { classifyOpportunityType } from '../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText, decodeHtmlEntities } from '../textSanitizer.js';

/**
 * Deterministic Normalization Service
 */
export function normalizeCompany(rawCompany = '') {
  if (!rawCompany || typeof rawCompany !== 'string') return 'Enterprise';
  return rawCompany
    .replace(/\b(Inc\.?|LLC\.?|Ltd\.?|Corp\.?|Corporation|GmbH|B\.V\.|S\.A\.|Pte\.?|Co\.?)\b/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeTitle(rawTitle = '') {
  if (!rawTitle || typeof rawTitle !== 'string') return 'Opportunity';
  return decodeHtmlEntities(rawTitle)
    .replace(/[\(\[\{].*?[\)\]\}]/g, '') // remove bracketed tags like (Full Time) or [Remote]
    .replace(/[^\w\s\/-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeRawOpportunity(rawItem, sourceMeta = {}, runId = null) {
  const rawTitle = rawItem.title || rawItem.name || 'Opportunity';
  const rawCompany = rawItem.company || rawItem.company_name || rawItem.organization || sourceMeta.name || 'Enterprise';
  const rawLocation = rawItem.location || rawItem.location_raw || sourceMeta.country || 'Global';
  const rawDesc = rawItem.description || rawItem.description_text || rawItem.content || '';

  const cleanTitle = decodeHtmlEntities(rawTitle.trim());
  const normTitle = normalizeTitle(cleanTitle);
  const cleanCompany = decodeHtmlEntities(rawCompany.trim());
  const normCompany = normalizeCompany(cleanCompany);
  const cleanDesc = sanitizeHtmlToText(rawDesc);
  const normLoc = normalizeLocation(rawLocation);
  const oppType = classifyOpportunityType(cleanTitle, cleanDesc) || sourceMeta.type || 'job';
  const stipend = extractSalaryFromText(rawDesc) || rawItem.stipend_text || 'Competitive Compensation';

  const extId = String(rawItem.id || rawItem.external_id || Math.random().toString(36).substring(2, 10));
  const applyUrl = rawItem.official_apply_url || rawItem.application_url || rawItem.source_url || rawItem.url || sourceMeta.base_url;

  // Exclusion Guard
  const combinedText = `${cleanTitle} ${cleanCompany} ${rawLocation} ${normLoc.country} ${normLoc.city} ${applyUrl}`.toLowerCase();
  if (
    combinedText.includes('israel') ||
    combinedText.includes('tel aviv') ||
    combinedText.includes('jerusalem') ||
    applyUrl.includes('.il/') ||
    applyUrl.endsWith('.il')
  ) {
    return null; // Excluded from ingestion
  }

  return {
    id: `opp-${sourceMeta.id || 'src'}-${extId}`,
    source_id: sourceMeta.id || 'custom-source',
    source_name: sourceMeta.name || 'Approved Source',
    source_type: sourceMeta.type || 'ats',
    external_id: extId,
    source_url: rawItem.source_url || applyUrl,
    title: cleanTitle,
    normalized_title: normTitle,
    company: cleanCompany,
    normalized_company: normCompany,
    organization: cleanCompany,
    description: cleanDesc || `${cleanTitle} at ${cleanCompany}`,
    opportunity_type: oppType,
    employment_type: rawItem.employment_type || 'full_time',
    location_country: normLoc.country || 'Global',
    location_city: normLoc.city || 'National',
    location_raw: rawLocation,
    normalized_location: `${normLoc.city ? normLoc.city + ', ' : ''}${normLoc.country || 'Global'}`,
    is_remote: normLoc.is_remote ? 1 : 0,
    work_mode: normLoc.is_remote ? 'remote' : (rawLocation.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite'),
    stipend_text: stipend,
    is_paid: 1,
    skills_required: typeof rawItem.skills_required === 'string' ? rawItem.skills_required : JSON.stringify(rawItem.skills_required || []),
    skills_preferred: typeof rawItem.skills_preferred === 'string' ? rawItem.skills_preferred : JSON.stringify(rawItem.skills_preferred || []),
    posted_at: rawItem.posted_at || new Date().toISOString(),
    deadline_utc: rawItem.deadline_utc || null,
    job_page_url: rawItem.job_page_url || applyUrl,
    official_apply_url: applyUrl,
    official_program_url: applyUrl,
    application_url_type: 'EXACT_JOB_APPLICATION',
    contact_email: rawItem.contact_email || `careers@${sourceMeta.domain || 'company.com'}`,
    source_tier: sourceMeta.tier || 1,
    source_authority_level: sourceMeta.tier || 1,
    trust_score: sourceMeta.trust_score || 95,
    confidence_score: 95.0,
    verification_level: 5,
    verification_status: 'VERIFIED_ACTIVE',
    status: 'active',
    lifecycle_status: 'ACTIVE',
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
    scrape_run_id: runId,
    raw_data: JSON.stringify({
      source_raw: rawItem,
      source_meta: sourceMeta
    })
  };
}

export default {
  normalizeCompany,
  normalizeTitle,
  normalizeRawOpportunity
};
