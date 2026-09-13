/**
 * CAREERLY ETHICAL HTTP CLIENT
 * 
 * Unified HTTP transport combining:
 * 1. SSRF-safe socket lookup & IP validation (safeHttpClient)
 * 2. RFC 9309 robots.txt permissions & Crawl-delay compliance (robotsComplianceService)
 * 3. Domain-level sliding window queue & exponential backoff on 429 (politeRateLimiter)
 * 4. Transparent, responsible CareerlyBot identity declaration
 */

import { safeFetch } from './safeHttpClient.js';
import { isUrlAllowed, getCrawlDelay } from './robotsComplianceService.js';
import { schedulePoliteRequest } from './politeRateLimiter.js';

export const OFFICIAL_BOT_USER_AGENT = 'CareerlyBot/2.0 (+https://careerly-finder.pages.dev/bot; compliance@careerly.app)';

/**
 * Performs an ethical, polite, SSRF-safe HTTP request
 * 
 * @param {string} url - Target URL to fetch
 * @param {Object} [options={}] - Execution options
 * @param {boolean} [options.respectRobots=true] - Whether to check and honor robots.txt
 * @param {boolean} [options.polite=true] - Whether to throttle requests per-domain
 * @returns {Promise<any>} Axios-compatible response object
 */
export async function ethicalFetch(url, options = {}) {
  const respectRobots = options.respectRobots !== false;
  const polite = options.polite !== false;

  let crawlDelayMs = null;

  // 1. Robots.txt Compliance Check
  if (respectRobots) {
    const robotsCheck = await isUrlAllowed(url, 'CareerlyBot');
    if (!robotsCheck.allowed) {
      const error = new Error(`Crawl skipped: ${robotsCheck.reason}`);
      error.code = 'ROBOTS_DISALLOWED';
      error.url = url;
      error.reason = robotsCheck.reason;
      console.warn(`[EthicalHttpClient] 🛡️ ${error.message} (${url})`);
      throw error;
    }
    crawlDelayMs = robotsCheck.crawlDelayMs;
  }

  // 2. Prepare Headers with Transparent Bot Identity
  const headers = {
    'User-Agent': OFFICIAL_BOT_USER_AGENT,
    'X-Crawler-Policy': 'https://careerly-finder.pages.dev/bot',
    'From': 'compliance@careerly.app',
    'Accept': 'application/json, text/html, application/xml;q=0.9, */*;q=0.8',
    ...(options.headers || {})
  };

  const fetchOptions = {
    ...options,
    headers
  };

  // 3. Execution Function via SSRF-safe Client
  const executeFetch = () => safeFetch(url, fetchOptions);

  // 4. Polite Rate Limiting & Queueing
  if (polite) {
    return await schedulePoliteRequest(url, executeFetch, {
      crawlDelayMs: crawlDelayMs || options.crawlDelayMs,
      baseDelayMs: options.baseDelayMs || 1800,
      jitterMs: options.jitterMs || 400
    });
  }

  return await executeFetch();
}

export default {
  OFFICIAL_BOT_USER_AGENT,
  ethicalFetch
};
