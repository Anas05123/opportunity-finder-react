import axios from 'axios';
import { normalizeLocation, detectLocationAndCountryCode } from '../locationNormalizer.js';
import { classifyOpportunityType } from '../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../textSanitizer.js';

/**
 * Serper Google Jobs Search Discovery Adapter
 * Queries Google Real-Time Search index for localized live opportunities with exact source URLs.
 * Never defaults to Malaysia; accurately detects global locations (e.g. Netherlands -> gl: nl) or searches worldwide (gl: us).
 */
export async function searchGoogleJobsViaSerper(query, location = '') {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.log('[Serper Adapter] SERPER_API_KEY not configured, skipping Google search.');
    return [];
  }

  const endpoint = 'https://google.serper.dev/search';

  // 1. Detect location and proper country code (gl)
  const locInfo = detectLocationAndCountryCode(location || query || '');
  const gl = locInfo.gl || 'us'; // Default worldwide (gl: us)

  // 2. Clean and formulate search query without appending "in Anywhere"
  let cleanQ = (query || '').trim();
  cleanQ = cleanQ.replace(/\b(in\s+anywhere|in\s+worldwide|in\s+global)\b/gi, '').trim();

  const locName = (location && location !== 'Anywhere' && location !== 'Worldwide') 
    ? location 
    : (locInfo.isExplicit && locInfo.country !== 'Worldwide' ? locInfo.country : '');

  let searchQuery = cleanQ;
  if (locName && !cleanQ.toLowerCase().includes(locName.toLowerCase())) {
    searchQuery = `${cleanQ} in ${locName} job`;
  } else if (!cleanQ.toLowerCase().includes('job') && !cleanQ.toLowerCase().includes('intern') && !cleanQ.toLowerCase().includes('scholarship') && !cleanQ.toLowerCase().includes('career')) {
    searchQuery = `${cleanQ} job`;
  }

  console.log(`[Serper Adapter] Querying Google: "${searchQuery}" | gl: "${gl}" | country: "${locInfo.country || 'Worldwide'}"`);

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
      const locationRaw = (locInfo.isExplicit && locInfo.country !== 'Worldwide') ? (locInfo.city ? `${locInfo.city}, ${locInfo.country}` : locInfo.country) : null;
      const normalizedLoc = normalizeLocation(locationRaw || item.snippet || (locInfo.country !== 'Worldwide' ? locInfo.country : null));
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
        location_country: normalizedLoc.country || locInfo.country || 'Worldwide',
        location_city: normalizedLoc.city || locInfo.city || null,
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
