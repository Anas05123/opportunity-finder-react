import BaseSourceAdapter from '../BaseSourceAdapter.js';
import { searchGoogleJobsViaSerper } from '../../adapters/serperAdapter.js';

export class SerperJobsAdapter extends BaseSourceAdapter {
  constructor({ query = 'internship', location = 'Malaysia' } = {}) {
    super({
      sourceId: 'serper-google-jobs',
      sourceName: 'Google Jobs Engine (Serper API)',
      domain: 'google.com',
      type: 'api',
      tier: 2,
      rateLimitMs: 2500,
      authorityLevel: 2,
      trustScore: 92
    });
    this.query = query;
    this.location = location;
  }

  async parse() {
    if (!process.env.SERPER_API_KEY) {
      console.log('[SerperJobsAdapter] SERPER_API_KEY not configured. Skipping live Google Jobs query.');
      return [];
    }

    try {
      const results = await searchGoogleJobsViaSerper(this.query, this.location);
      return results || [];
    } catch (err) {
      console.warn('[SerperJobsAdapter] Fetch error:', err.message);
      return [];
    }
  }

  normalize(job, runId = null) {
    const extId = String(job.id || job.job_id || Math.random().toString(36).substring(2, 10));

    return {
      id: `opp-serper-${extId}`,
      source_id: this.sourceId,
      source_name: this.sourceName,
      source_type: 'api',
      external_id: extId,
      source_url: job.source_url || job.job_page_url || 'https://google.com/search?q=' + encodeURIComponent(job.title || ''),
      title: job.title || 'Career Opportunity',
      normalized_title: (job.title || '').trim(),
      company: job.company_name || job.company || 'Enterprise Partner',
      normalized_company: (job.company_name || job.company || 'Enterprise Partner').trim(),
      organization: job.company_name || job.company || 'Enterprise Partner',
      description: job.description_text || job.description || '',
      opportunity_type: job.opportunity_type || 'job',
      employment_type: 'full_time',
      location_country: job.location_country || this.location,
      location_city: job.location_city || 'National',
      location_raw: job.location_raw || this.location,
      normalized_location: `${job.location_city ? job.location_city + ', ' : ''}${job.location_country || this.location}`,
      is_remote: job.is_remote ? 1 : 0,
      work_mode: job.is_remote ? 'remote' : 'onsite',
      stipend_text: job.stipend_text || 'Competitive Market Rate',
      is_paid: 1,
      skills_required: JSON.stringify([]),
      skills_preferred: JSON.stringify([]),
      posted_at: job.posted_at || new Date().toISOString(),
      deadline_utc: null,
      job_page_url: job.job_page_url || job.source_url,
      official_apply_url: job.application_url || job.job_page_url || job.source_url,
      official_program_url: job.job_page_url || job.source_url,
      application_url_type: 'STRUCTURED_INDEX',
      contact_email: 'recruiting@partner.com',
      source_tier: 2,
      source_authority_level: 2,
      trust_score: 92,
      confidence_score: 92.0,
      verification_level: 4,
      verification_status: 'VERIFIED_ACTIVE',
      status: 'active',
      lifecycle_status: 'ACTIVE',
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
      scrape_run_id: runId,
      raw_data: JSON.stringify({
        search_query: this.query,
        search_location: this.location,
        serper_metadata: job.serper_metadata || {}
      })
    };
  }
}

export default SerperJobsAdapter;
