import BaseSourceAdapter from '../BaseSourceAdapter.js';
import { normalizeLocation } from '../../locationNormalizer.js';
import { classifyOpportunityType } from '../../typeClassifier.js';
import { sanitizeHtmlToText, extractSalaryFromText } from '../../textSanitizer.js';

export class GreenhouseAdapter extends BaseSourceAdapter {
  constructor({ boardToken = 'cloudflare', companyName = 'Cloudflare' } = {}) {
    super({
      sourceId: `greenhouse-${boardToken.toLowerCase()}`,
      sourceName: `Greenhouse (${companyName})`,
      domain: 'boards-api.greenhouse.io',
      type: 'ats',
      tier: 1,
      rateLimitMs: 1200,
      authorityLevel: 1,
      trustScore: 99
    });
    this.boardToken = boardToken;
    this.companyName = companyName;
  }

  async parse() {
    const endpoint = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(this.boardToken)}/jobs`;
    const res = await this.fetch(endpoint, { timeout: 15000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (!data || !Array.isArray(data.jobs)) return [];
    return data.jobs;
  }

  normalize(job, runId = null) {
    const locationRaw = job.location?.name || (Array.isArray(job.offices) && job.offices[0]?.name) || null;
    const normalizedLoc = normalizeLocation(locationRaw);
    const cleanDesc = sanitizeHtmlToText(job.content || '');
    const oppType = classifyOpportunityType(job.title, cleanDesc);
    const salaryText = extractSalaryFromText(job.content || '');

    const extId = String(job.id || '');
    const normTitle = (job.title || '').trim();
    const normCompany = this.companyName.trim();

    return {
      id: `opp-gh-${this.boardToken}-${extId}`,
      source_id: this.sourceId,
      source_name: this.sourceName,
      source_type: 'ats',
      external_id: extId,
      source_url: job.absolute_url || `https://boards.greenhouse.io/${this.boardToken}/jobs/${extId}`,
      title: job.title,
      normalized_title: normTitle,
      company: this.companyName,
      normalized_company: normCompany,
      organization: this.companyName,
      description: cleanDesc,
      opportunity_type: oppType,
      employment_type: 'full_time',
      location_country: normalizedLoc.country,
      location_city: normalizedLoc.city,
      location_raw: locationRaw,
      normalized_location: `${normalizedLoc.city ? normalizedLoc.city + ', ' : ''}${normalizedLoc.country}`,
      is_remote: normalizedLoc.is_remote ? 1 : 0,
      work_mode: normalizedLoc.is_remote ? 'remote' : (locationRaw && locationRaw.toLowerCase().includes('hybrid') ? 'hybrid' : 'onsite'),
      stipend_text: salaryText || 'Market Competitive',
      is_paid: 1,
      skills_required: JSON.stringify([]),
      skills_preferred: JSON.stringify([]),
      posted_at: job.updated_at || new Date().toISOString(),
      deadline_utc: null,
      job_page_url: job.absolute_url,
      official_apply_url: job.absolute_url ? `${job.absolute_url}#app` : null,
      official_program_url: job.absolute_url,
      application_url_type: 'EXACT_JOB_APPLICATION',
      contact_email: `careers@${this.boardToken}.com`,
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
        board_token: this.boardToken,
        departments: job.departments || [],
        offices: job.offices || [],
        metadata: job.metadata || [],
        raw_updated_at: job.updated_at
      })
    };
  }
}

export default GreenhouseAdapter;
