import { safeFetch } from './safeHttpClient.js';
import * as cheerio from 'cheerio';

/**
 * Multi-Signal Verification Engine (V3)
 * Level 0: Dead / Unreachable (404, 410, DNS fail)
 * Level 1: HTTP 200 reachable
 * Level 2: Job Document detected (matching title / JSON-LD)
 * Level 3: Application form / mechanism present
 * Level 4: Active listing confirmed (Passed negative keyword closure checks)
 * Level 5: Official Employer ATS / Domain confirmed
 */

export const CLOSURE_PATTERNS = [
  /(position|job|requisition|role)\s+(has\s+been|is|was)\s+(closed|filled|cancelled|archived)/i,
  /(applications|admissions)\s+(are|is)\s+(now\s+)?closed/i,
  /this\s+(posting|job|role|position)\s+(has\s+expired|is\s+no\s+longer\s+available)/i,
  /no\s+longer\s+accepting\s+applications/i,
  /the\s+job\s+you\s+are\s+looking\s+for\s+does\s+not\s+exist/i,
  /role\s+no\s+longer\s+available/i
];

export async function verifyOpportunityLiveness(opportunity) {
  const urlToProbe = opportunity.official_apply_url || opportunity.application_url || opportunity.job_page_url || opportunity.source_url;
  if (!urlToProbe || !urlToProbe.startsWith('http')) {
    return {
      verification_level: 0,
      verification_status: 'DEAD',
      evidence_text: 'Invalid or missing target URL',
      http_status_code: 0
    };
  }

  const startTime = Date.now();

  try {
    const res = await safeFetch(urlToProbe, { timeout: 4000 });
    const responseTime = Date.now() - startTime;
    const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    // 1. Check HTTP Status
    if (res.status >= 400) {
      return {
        verification_level: 0,
        verification_status: 'DEAD',
        evidence_text: `HTTP ${res.status} error from destination`,
        http_status_code: res.status,
        response_time_ms: responseTime
      };
    }

    // 2. Negative Closure Pattern Scan (Reject closed / filled / expired jobs)
    for (const pattern of CLOSURE_PATTERNS) {
      if (pattern.test(html)) {
        return {
          verification_level: 1,
          verification_status: 'EXPIRED',
          evidence_text: `Page contains closure notice matching: ${pattern.toString()}`,
          http_status_code: res.status,
          response_time_ms: responseTime
        };
      }
    }

    const $ = cheerio.load(html);

    // 3. Check for Application Mechanism (Form, Apply Button, or ATS iframe)
    let hasApplyMechanism = false;
    if ($('form[action*="apply"], form[action*="job"], input[type="file"], a[href*="apply"], button:contains("Apply"), .application-form').length > 0) {
      hasApplyMechanism = true;
    } else if (urlToProbe.includes('greenhouse.io') || urlToProbe.includes('lever.co') || urlToProbe.includes('smartrecruiters.com')) {
      hasApplyMechanism = true;
    }

    // 4. Check for JSON-LD JobPosting schema
    let hasJobSchema = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'JobPosting' || (Array.isArray(json['@graph']) && json['@graph'].some(g => g['@type'] === 'JobPosting'))) {
          hasJobSchema = true;
        }
      } catch (e) {}
    });

    const isAts = (opportunity.source_authority_level === 1 || urlToProbe.includes('greenhouse.io') || urlToProbe.includes('lever.co'));
    const level = isAts ? 5 : (hasApplyMechanism && hasJobSchema ? 4 : (hasApplyMechanism ? 3 : 2));

    return {
      verification_level: level,
      verification_status: level >= 3 ? 'VERIFIED_ACTIVE' : 'REACHABLE_UNVERIFIED',
      evidence_text: `HTTP ${res.status} OK • Form: ${hasApplyMechanism} • Schema: ${hasJobSchema}`,
      http_status_code: res.status,
      response_time_ms: responseTime
    };

  } catch (err) {
    return {
      verification_level: 0,
      verification_status: 'DEAD',
      evidence_text: `Network probe error: ${err.message}`,
      http_status_code: 0,
      response_time_ms: Date.now() - startTime
    };
  }
}

export default { verifyOpportunityLiveness, CLOSURE_PATTERNS };
