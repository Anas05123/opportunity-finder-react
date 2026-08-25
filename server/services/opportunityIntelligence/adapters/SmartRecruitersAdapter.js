import BaseSourceAdapter from '../BaseSourceAdapter.js';
import { normalizeLocation } from '../../locationNormalizer.js';
import { classifyOpportunityType } from '../../typeClassifier.js';
import { sanitizeHtmlToText } from '../../textSanitizer.js';

export class SmartRecruitersAdapter extends BaseSourceAdapter {
  constructor({ companyIdentifier = 'visa', companyName = 'Visa' } = {}) {
    super({
      sourceId: `smartrecruiters-${companyIdentifier.toLowerCase()}`,
      sourceName: `SmartRecruiters (${companyName})`,
      domain: 'api.smartrecruiters.com',
      type: 'ats',
      tier: 1,
      rateLimitMs: 1500,
      authorityLevel: 1,
      trustScore: 98
    });
    this.companyIdentifier = companyIdentifier;
    this.companyName = companyName;
  }

  async parse() {
    const endpoint = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(this.companyIdentifier)}/postings?limit=25`;
    const res = await this.fetch(endpoint, { timeout: 8000 });
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
    if (!data || !Array.isArray(data.content)) return [];
    return data.content;
  }

  normalize(job, runId = null) {
    const locCity = job.location?.city || '';
    const locCountry = job.location?.country || 'Global';
    const locationRaw = [locCity, job.location?.region, locCountry].filter(Boolean).join(', ');
    const normalizedLoc = normalizeLocation(locationRaw);
    const oppType = classifyOpportunityType(job.name || '', '');

    const extId = String(job.id || '');
    const applyUrl = `https://jobs.smartrecruiters.com/${this.companyIdentifier}/${extId}`;

    return {
      id: `opp-sr-${this.companyIdentifier}-${extId}`,
      source_id: this.sourceId,
      source_name: this.sourceName,
      source_type: 'ats',
      external_id: extId,
      source_url: applyUrl,
      title: job.name,
      normalized_title: (job.name || '').trim(),
      company: this.companyName,
      normalized_company: this.companyName.trim(),
      organization: this.companyName,
      description: `${job.name} at ${this.companyName} in ${locationRaw}. Department: ${job.department?.label || 'General'}.`,
      opportunity_type: oppType,
      employment_type: (job.typeOfEmployment?.label || 'full_time').toLowerCase().replace(/\s+/g, '_'),
      location_country: normalizedLoc.country || locCountry,
      location_city: normalizedLoc.city || locCity,
      location_raw: locationRaw,
      normalized_location: `${normalizedLoc.city ? normalizedLoc.city + ', ' : ''}${normalizedLoc.country || locCountry}`,
      is_remote: (job.location?.remote || normalizedLoc.is_remote) ? 1 : 0,
      work_mode: (job.location?.remote || normalizedLoc.is_remote) ? 'remote' : 'onsite',
      stipend_text: 'Competitive Compensation',
      is_paid: 1,
      skills_required: JSON.stringify([]),
      skills_preferred: JSON.stringify([]),
      posted_at: job.releasedDate || new Date().toISOString(),
      deadline_utc: null,
      job_page_url: applyUrl,
      official_apply_url: applyUrl,
      official_program_url: applyUrl,
      application_url_type: 'EXACT_JOB_APPLICATION',
      contact_email: `careers@${this.companyIdentifier}.com`,
      source_tier: 1,
      source_authority_level: 1,
      trust_score: 98,
      confidence_score: 98.0,
      verification_level: 5,
      verification_status: 'VERIFIED_ACTIVE',
      status: 'active',
      lifecycle_status: 'ACTIVE',
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      scrape_run_id: runId,
      raw_data: JSON.stringify({
        company_id: this.companyIdentifier,
        department: job.department,
        type_of_employment: job.typeOfEmployment,
        experience_level: job.experienceLevel,
        location: job.location
      })
    };
  }
}

export default SmartRecruitersAdapter;
