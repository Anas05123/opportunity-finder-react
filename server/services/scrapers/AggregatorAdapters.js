import { BaseAdapter } from './BaseAdapter.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class OpportunityDeskAdapter extends BaseAdapter {
  constructor() {
    super('src-op-desk', 'Opportunity Desk', 'opportunitydesk.org', 3);
    this.rssUrl = 'https://opportunitydesk.org/feed/';
  }

  async parse() {
    const opps = [];
    try {
      const res = await axios.get(this.rssUrl, { timeout: 10000 });
      const $ = cheerio.load(res.data, { xmlMode: true });

      $('item').slice(0, 10).each((idx, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const desc = $(el).find('description').text().replace(/<[^>]+>/g, '').trim();

        if (!title) return;

        const field = this.categorizeField(title, desc);
        const funding = this.calculateFunding(title, desc);

        opps.push({
          id: `opdesk-${Math.abs(hashString(title))}`,
          title: title,
          organization: 'Opportunity Desk Global Network',
          location_country: 'Global / Multi-Destination',
          location_city: 'Host University',
          is_remote: desc.toLowerCase().includes('online') || desc.toLowerCase().includes('virtual') ? 1 : 0,
          type: title.toLowerCase().includes('intern') ? 'internship' : title.toLowerCase().includes('fellow') ? 'fellowship' : 'scholarship',
          funding_level: funding.level,
          stipend_text: funding.level === 'fully_funded' ? '100% Tuition + Living Stipend + Flight' : 'Stipend / Allowance Covered',
          tuition_covered: funding.tuition,
          travel_covered: funding.travel,
          housing_covered: funding.housing,
          degree_level: 'undergrad',
          field_of_study: field,
          deadline_utc: this.normalizeDeadline(desc),
          deadline_raw: 'See Official Portal',
          official_apply_url: link,
          official_program_url: link,
          source_url: this.rssUrl,
          description: desc.slice(0, 300) + '...',
          benefits_summary: 'Full financial sponsorship, monthly allowance, and international exposure.',
          eligibility_summary: 'Open to international candidates. Refer to official portal for exact details.',
          trust_score: 85,
          quality_score: 85,
          verification_status: 'trusted_source',
          is_popular: 1
        });
      });
    } catch (err) {
      console.error('[-] Opportunity Desk RSS failed:', err.message);
    }
    return opps;
  }
}

export class OpportunitiesCircleAdapter extends BaseAdapter {
  constructor() {
    super('src-op-circle', 'Opportunities Circle', 'opportunitiescircle.com', 3);
    this.rssUrl = 'https://www.opportunitiescircle.com/feed/';
  }

  async parse() {
    const opps = [];
    try {
      const res = await axios.get(this.rssUrl, { timeout: 10000 });
      const $ = cheerio.load(res.data, { xmlMode: true });

      $('item').slice(0, 10).each((idx, el) => {
        const title = $(el).find('title').text().trim();
        const link = $(el).find('link').text().trim();
        const desc = $(el).find('description').text().replace(/<[^>]+>/g, '').trim();

        if (!title) return;

        const field = this.categorizeField(title, desc);
        const funding = this.calculateFunding(title, desc);

        opps.push({
          id: `opcircle-${Math.abs(hashString(title))}`,
          title: title,
          organization: 'Opportunities Circle Feed',
          location_country: 'Global / Worldwide',
          location_city: 'Host Campus',
          is_remote: 0,
          type: title.toLowerCase().includes('intern') ? 'internship' : title.toLowerCase().includes('fellow') ? 'fellowship' : 'scholarship',
          funding_level: funding.level,
          stipend_text: 'Fully Funded / Paid Allowance',
          tuition_covered: funding.tuition,
          travel_covered: funding.travel,
          housing_covered: funding.housing,
          degree_level: 'undergrad',
          field_of_study: field,
          deadline_utc: this.normalizeDeadline(desc),
          deadline_raw: 'See Link',
          official_apply_url: link,
          official_program_url: link,
          source_url: this.rssUrl,
          description: desc.slice(0, 300) + '...',
          benefits_summary: 'Full living allowance, flight grant, and university coverage.',
          eligibility_summary: 'International applicants welcome.',
          trust_score: 82,
          quality_score: 82,
          verification_status: 'trusted_source',
          is_popular: 1
        });
      });
    } catch (err) {
      console.error('[-] Opportunities Circle RSS failed:', err.message);
    }
    return opps;
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
