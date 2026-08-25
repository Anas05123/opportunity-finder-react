import BaseSourceAdapter from '../BaseSourceAdapter.js';
import { normalizeLocation } from '../../locationNormalizer.js';
import { classifyOpportunityType } from '../../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../../textSanitizer.js';

export class LeverAdapter extends BaseSourceAdapter {
  constructor({ companySlug = 'spotify', companyName = 'Spotify' } = {}) {
    super({
      sourceId: `lever-${companySlug.toLowerCase()}`,
      sourceName: `Lever (${companyName})`,
      domain: 'api.lever.co',
      type: 'ats',
      tier: 1,
      rateLimitMs: 1200,
      authorityLevel: 1,
      trustScore: 99
    });
    this.companySlug = companySlug;
    this.companyName = companyName;
  }

  async parse() {
    const endpoint = `https://api.lever.co/v0/postings/${encodeURIComponent(this.companySlug)}?mode=json`;
    const res = await this.fetch(endpoint, { timeout: 8000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (!Array.isArray(data)) return [];
    return data;
  }

  normalize(job, runId = null) {
    const locationRaw = job.categories?.location || (job.workplaceType === 'remote' ? 'Remote / Worldwide' : null);
    const normalizedLoc = normalizeLocation(locationRaw);
    const rawDesc = job.description || job.descriptionPlain || '';
    const cleanDesc = sanitizeHtmlToText(rawDesc);
    const oppType = classifyOpportunityType(job.text, cleanDesc);
    const salaryText = extractSalaryFromText(rawDesc);

    const extId = String(job.id || '');
    const normTitle = (job.text || '').trim();
    const normCompany = this.companyName.trim();

    return {
      id: `opp-lever-${this.companySlug}-${extId}`,
      source_id: this.sourceId,
      source_name: this.sourceName,
      source_type: 'ats',
      external_id: extId,
      source_url: job.hostedUrl || `https://jobs.lever.co/${this.companySlug}/${extId}`,
      title: job.text,
      normalized_title: normTitle,
      company: this.companyName,
      normalized_company: normCompany,
      organization: this.companyName,
      description: cleanDesc,
      opportunity_type: oppType,
      employment_type: (job.categories?.commitment || 'full_time').toLowerCase().replace(/\s+/g, '_'),
      location_country: normalizedLoc.country,
      location_city: normalizedLoc.city,
      location_raw: locationRaw,
      normalized_location: `${normalizedLoc.city ? normalizedLoc.city + ', ' : ''}${normalizedLoc.country}`,
      is_remote: (normalizedLoc.is_remote || job.workplaceType === 'remote') ? 1 : 0,
      work_mode: (normalizedLoc.is_remote || job.workplaceType === 'remote') ? 'remote' : 'onsite',
      stipend_text: salaryText || 'Market Competitive',
      is_paid: 1,
      skills_required: JSON.stringify([]),
      skills_preferred: JSON.stringify([]),
      posted_at: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
      deadline_utc: null,
      job_page_url: job.hostedUrl,
      official_apply_url: job.applyUrl || (job.hostedUrl ? `${job.hostedUrl}/apply` : null),
      official_program_url: job.hostedUrl,
      application_url_type: 'EXACT_JOB_APPLICATION',
      contact_email: `careers@${this.companySlug}.com`,
      source_tier: 1,
      source_authority_level: 1,
      trust_score: 99,
      confidence_score: 99.0,
      verification_level: 5,
      verification_status: 'VERIFIED_ACTIVE',
      status: 'active',
      lifecycle_status: 'ACTIVE',
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      scrape_run_id: runId,
      raw_data: JSON.stringify({
        company_slug: this.companySlug,
        categories: job.categories || {},
        workplace_type: job.workplaceType,
        lists: job.lists || []
      })
    };
  }
}

export default LeverAdapter;
