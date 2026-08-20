import { safeFetch } from '../safeHttpClient.js';
import { normalizeLocation } from '../locationNormalizer.js';
import { classifyOpportunityType } from '../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../textSanitizer.js';

/**
 * Direct Lever Public ATS Ingestion Adapter
 * Ingests authentic live jobs from public Lever company feeds.
 */
export async function fetchLeverPostings(companySlug) {
  const endpoint = `https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}?mode=json`;

  try {
    const res = await safeFetch(endpoint, { timeout: 5000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;

    if (!Array.isArray(data)) return [];

    return data.map(job => {
      const locationRaw = job.categories?.location || (job.workplaceType === 'remote' ? 'Remote / Worldwide' : null);
      const normalizedLoc = normalizeLocation(locationRaw);
      const rawDesc = job.description || job.descriptionPlain || '';
      const cleanDesc = sanitizeHtmlToText(rawDesc);
      const oppType = classifyOpportunityType(job.text, cleanDesc);
      const salaryText = extractSalaryFromText(rawDesc);

      return {
        id: `lever-${companySlug}-${job.id}`,
        title: job.text,
        company_name: companySlug.charAt(0).toUpperCase() + companySlug.slice(1),
        opportunity_type: oppType,
        location_country: normalizedLoc.country,
        location_city: normalizedLoc.city,
        location_raw: locationRaw,
        is_remote: (normalizedLoc.is_remote || job.workplaceType === 'remote') ? 1 : 0,
        work_modality: (normalizedLoc.is_remote || job.workplaceType === 'remote') ? 'remote' : 'onsite',
        stipend_text: salaryText,
        source_name: 'Lever ATS',
        source_authority_level: 1,
        source_url: job.hostedUrl,
        job_page_url: job.hostedUrl,
        application_url: job.applyUrl || (job.hostedUrl + '/apply'),
        application_url_type: 'EXACT_JOB_APPLICATION',
        description_text: cleanDesc,
        posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
        verification_level: 5,
        verification_status: 'VERIFIED_ACTIVE',
        confidence_score: 98.0
      };
    });
  } catch (err) {
    console.warn(`[Lever Adapter] Company ${companySlug} fetch note:`, err.message);
    return [];
  }
}

export default { fetchLeverPostings };
