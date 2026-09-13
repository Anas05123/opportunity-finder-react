/**
 * CAREERLY POLITE DOMAIN RATE LIMITER & ADAPTIVE BACKOFF ENGINE
 * 
 * Enforces ethical crawling policies:
 * - Domain-isolated sliding window delays (prevents DDoS-like traffic bursts)
 * - Dynamic Crawl-delay compliance from robots.txt
 * - Randomized jitter to eliminate robotic request signatures
 * - Adaptive exponential backoff on HTTP 429 (Too Many Requests) & 503
 */

// Map<hostname, { lastRequestTime: number, activeQueue: Promise, backoffUntil: number, backoffStep: number }>
const DOMAIN_STATES = new Map();

const DEFAULT_BASE_DELAY_MS = 1800; // 1.8 seconds default polite spacing
const DEFAULT_JITTER_MS = 400;      // 0-400ms random variation
const MAX_BACKOFF_MS = 120000;      // 2 minutes maximum backoff
const INITIAL_BACKOFF_MS = 5000;    // 5 seconds initial backoff

/**
 * Extracts normalized hostname from a URL
 */
function getHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return 'unknown-host';
  }
}

/**
 * Parses HTTP Retry-After header (supports either integer seconds or HTTP-Date)
 */
export function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const asSec = parseInt(headerValue, 10);
  if (!isNaN(asSec) && asSec > 0) {
    return asSec * 1000;
  }
  const asDate = Date.parse(headerValue);
  if (!isNaN(asDate)) {
    const diff = asDate - Date.now();
    return diff > 0 ? diff : null;
  }
  return null;
}

/**
 * Asynchronous sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Schedules and executes an outbound crawler request politely
 * 
 * @param {string} url - Target URL
 * @param {Function} requestFn - Function returning a Promise (e.g. () => axios.get(...))
 * @param {Object} [options={}] - Options (crawlDelayMs, baseDelayMs)
 * @returns {Promise<any>} Result of requestFn
 */
export async function schedulePoliteRequest(url, requestFn, options = {}) {
  const host = getHostname(url);
  const now = Date.now();

  let state = DOMAIN_STATES.get(host);
  if (!state) {
    state = {
      lastRequestTime: 0,
      activeQueue: Promise.resolve(),
      backoffUntil: 0,
      backoffStep: 0
    };
    DOMAIN_STATES.set(host, state);
  }

  // Chain this request onto the domain's serialization queue
  const executeChained = async () => {
    // 1. Check if domain is under active backoff
    const currentBackoff = state.backoffUntil - Date.now();
    if (currentBackoff > 0) {
      await sleep(currentBackoff);
    }

    // 2. Calculate required spacing
    const requiredDelay = Math.max(
      options.crawlDelayMs || 0,
      options.baseDelayMs || DEFAULT_BASE_DELAY_MS
    );
    const jitter = Math.floor(Math.random() * (options.jitterMs || DEFAULT_JITTER_MS));
    const totalRequiredSpacing = requiredDelay + jitter;

    const timeSinceLast = Date.now() - state.lastRequestTime;
    if (timeSinceLast < totalRequiredSpacing) {
      const waitTime = totalRequiredSpacing - timeSinceLast;
      await sleep(waitTime);
    }

    state.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      // On success, gradually reset backoff
      if (state.backoffStep > 0) {
        state.backoffStep = Math.max(0, state.backoffStep - 1);
      }
      return result;
    } catch (err) {
      const statusCode = err.response?.status || err.status;

      // Handle Rate Limiting (429) & Server Overload (503)
      if (statusCode === 429 || statusCode === 503) {
        const retryAfterMs = parseRetryAfter(err.response?.headers?.['retry-after']);
        const backoffDuration = retryAfterMs || Math.min(
          INITIAL_BACKOFF_MS * Math.pow(2, state.backoffStep),
          MAX_BACKOFF_MS
        );

        state.backoffUntil = Date.now() + backoffDuration;
        state.backoffStep++;

        console.warn(`[PoliteRateLimiter] Host ${host} returned HTTP ${statusCode}. Backing off for ${Math.round(backoffDuration / 1000)}s.`);
      }

      throw err;
    }
  };

  // Queue up execution
  const currentTask = state.activeQueue.then(executeChained, executeChained);
  state.activeQueue = currentTask.catch(() => {}); // prevent unhandled rejection in queue chain
  return currentTask;
}

/**
 * Reset all domain rate limiter states (for tests)
 */
export function resetRateLimiter() {
  DOMAIN_STATES.clear();
}

export default {
  schedulePoliteRequest,
  parseRetryAfter,
  resetRateLimiter
};
