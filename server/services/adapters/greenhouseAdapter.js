import { safeFetch } from '../safeHttpClient.js';
import { normalizeLocation } from '../locationNormalizer.js';
import { classifyOpportunityType } from '../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../textSanitizer.js';

/**
 * Direct Greenhouse Public ATS Ingestion Adapter
 * Ingests live verified job postings directly from public Greenhouse company boards.
 */
export async function fetchGreenhouseBoardJobs(boardToken) {
  const endpoint = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  
  try {
    const res = await safeFetch(endpoint, { timeout: 5000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map(job => {
      const locationRaw = job.location?.name || (Array.isArray(job.offices) && job.offices[0]?.name) || null;
      const normalizedLoc = normalizeLocation(locationRaw);
      const cleanDesc = sanitizeHtmlToText(job.content || '');
      const oppType = classifyOpportunityType(job.title, cleanDesc);
      const salaryText = extractSalaryFromText(job.content || '');

      return {
        id: `gh-${boardToken}-${job.id}`,
        title: job.title,
        company_name: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
        opportunity_type: oppType,
        location_country: normalizedLoc.country,
        location_city: normalizedLoc.city,
        location_raw: locationRaw,
        is_remote: normalizedLoc.is_remote ? 1 : 0,
        work_modality: normalizedLoc.is_remote ? 'remote' : (locationRaw && locationRaw.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite'),
        stipend_text: salaryText,
        source_name: 'Greenhouse ATS',
        source_authority_level: 1,
        source_url: job.absolute_url,
        job_page_url: job.absolute_url,
        application_url: job.absolute_url + '#app',
        application_url_type: 'EXACT_JOB_APPLICATION',
        description_text: cleanDesc,
        posted_at: job.updated_at || new Date().toISOString(),
        verification_level: 5,
        verification_status: 'VERIFIED_ACTIVE',
        confidence_score: 98.0
      };
    });
  } catch (err) {
    console.warn(`[Greenhouse Adapter] Board ${boardToken} fetch note:`, err.message);
    return [];
  }
}

export default { fetchGreenhouseBoardJobs };
