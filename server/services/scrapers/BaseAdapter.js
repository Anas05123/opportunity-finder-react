import axios from 'axios';
import crypto from 'crypto';

export class BaseAdapter {
  constructor(sourceId, sourceName, domain, tier = 3) {
    this.sourceId = sourceId;
    this.sourceName = sourceName;
    this.domain = domain;
    this.tier = tier;
    this.rateLimitMs = 1500;
  }

  async fetch(url) {
    const headers = {
      'User-Agent': 'OpportunityHub-Discovery-Bot/1.0 (+https://opportunityhub.global/bot)'
    };
    try {
      const response = await axios.get(url, { headers, timeout: 12000 });
      return {
        statusCode: response.status,
        data: response.data,
        contentHash: crypto.createHash('sha256').update(String(response.data)).digest('hex')
      };
    } catch (err) {
      console.error(`[-] [${this.sourceName}] Error fetching ${url}:`, err.message);
      throw err;
    }
  }

  calculateFunding(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (text.includes('fully funded') || (text.includes('full tuition') && (text.includes('stipend') || text.includes('allowance')))) {
      return { level: 'fully_funded', tuition: 1, travel: 1, housing: 1 };
    }
    if (text.includes('paid internship') || text.includes('hourly') || text.includes('/ month') || text.includes('stipend')) {
      return { level: 'paid_salary', tuition: 0, travel: 0, housing: 0 };
    }
    if (text.includes('tuition waiver') || text.includes('tuition fee')) {
      return { level: 'tuition_only', tuition: 1, travel: 0, housing: 0 };
    }
    return { level: 'funded', tuition: 0, travel: 0, housing: 0 };
  }

  categorizeField(title, desc) {
    const text = `${title} ${desc}`.toLowerCase();
    if (text.includes('advertis') || text.includes('market') || text.includes('brand') || text.includes('copywrit') || text.includes('pr ') || text.includes('public relations') || text.includes('creative media')) {
      return 'advertising';
    }
    if (text.includes('computer') || text.includes('software') || text.includes(' ai ') || text.includes('tech') || text.includes('data science')) {
      return 'stem';
    }
    if (text.includes('physic') || text.includes('engineer') || text.includes('robot') || text.includes('cern')) {
      return 'engineering';
    }
    if (text.includes('business') || text.includes('econom') || text.includes('financ') || text.includes('mba')) {
      return 'business';
    }
    if (text.includes('bio') || text.includes('health') || text.includes('medici')) {
      return 'health';
    }
    return 'social';
  }

  normalizeDeadline(rawText) {
    const now = new Date();
    // Default estimated 90 days if unstated
    const defaultDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    return defaultDate.toISOString().slice(0, 10);
  }
}
