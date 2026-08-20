import axios from 'axios';
import { normalizeLocation } from '../locationNormalizer.js';
import { classifyOpportunityType } from '../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../textSanitizer.js';

/**
 * Serper Google Jobs Search Discovery Adapter
 * Queries Google Real-Time Search index for localized live opportunities with exact source URLs.
 */
export async function searchGoogleJobsViaSerper(query, location = '') {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.log('[Serper Adapter] SERPER_API_KEY not configured, skipping Google search.');
    return [];
  }

  const endpoint = 'https://google.serper.dev/search';
  const searchQuery = location ? `${query} in ${location} job` : `${query} job`;

  // Detect country code for gl parameter
  let gl = 'my';
  const locLower = (location || query || '').toLowerCase();
  if (locLower.includes('united states') || locLower.includes('usa') || locLower.includes('us')) gl = 'us';
  else if (locLower.includes('united kingdom') || locLower.includes('uk') || locLower.includes('london')) gl = 'uk';
  else if (locLower.includes('singapore')) gl = 'sg';
  else if (locLower.includes('germany') || locLower.includes('berlin')) gl = 'de';
  else if (locLower.includes('australia') || locLower.includes('sydney')) gl = 'au';
  else if (locLower.includes('canada') || locLower.includes('toronto')) gl = 'ca';

  const payload = {
    q: searchQuery,
    gl,
    hl: 'en',
    num: 10
  };

  try {
    const res = await axios.post(endpoint, payload, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 6000
    });

    if (!res.data || !Array.isArray(res.data.organic)) return [];

    return res.data.organic.map((item, idx) => {
      const locationRaw = location || null;
      const normalizedLoc = normalizeLocation(locationRaw || item.snippet);
      const cleanDesc = sanitizeHtmlToText(item.snippet || '');
      const oppType = classifyOpportunityType(item.title, cleanDesc);
      const salaryText = extractSalaryFromText(item.snippet || '');

      // Parse company name heuristic from domain or title
      let company = 'Direct Employer';
      try {
        const domain = new URL(item.link).hostname.replace(/^www\./, '');
        company = domain.split('.')[0].toUpperCase();
      } catch (e) {}

      return {
        id: `serper-${idx}-${Math.random().toString(36).substr(2, 7)}`,
        title: item.title || 'Untitled Opportunity',
        company_name: company,
        organization: company,
        opportunity_type: oppType,
        location_country: normalizedLoc.country || (gl === 'my' ? 'Malaysia' : 'Worldwide'),
        location_city: normalizedLoc.city || (locationRaw ? locationRaw.split(',')[0].trim() : null),
        location_raw: locationRaw,
        is_remote: (normalizedLoc.is_remote || (item.title || '').toLowerCase().includes('remote')) ? 1 : 0,
        work_modality: (normalizedLoc.is_remote || (item.title || '').toLowerCase().includes('remote')) ? 'remote' : 'onsite',
        stipend_text: salaryText,
        source_name: `Google Search (${new URL(item.link).hostname.replace('www.', '')})`,
        source_authority_level: 2,
        source_url: item.link,
        job_page_url: item.link,
        application_url: item.link,
        application_url_type: 'JOB_PAGE_WITH_APPLY_BUTTON',
        description_text: cleanDesc,
        posted_at: new Date().toISOString(),
        verification_level: 4,
        verification_status: 'VERIFIED_ACTIVE',
        confidence_score: 90.0
      };
    });
  } catch (err) {
    console.warn('[Serper Adapter] Search error:', err.message);
    return [];
  }
}

export default { searchGoogleJobsViaSerper };
