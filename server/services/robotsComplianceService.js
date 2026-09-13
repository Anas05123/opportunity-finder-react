/**
 * CAREERLY ROBOTS.TXT COMPLIANCE SERVICE (RFC 9309)
 * 
 * Provides automated, ethical robots.txt inspection, parsing, and caching.
 * Ensures CareerlyBot strictly adheres to webmaster crawling permissions,
 * path exclusions, and Crawl-delay directives.
 */

import { safeFetch } from './safeHttpClient.js';

// Cache structure: Map<origin, { parsedAt: number, rules: Array, crawlDelayMs: number, status: number }>
const ROBOTS_CACHE = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BOT_NAME = 'CareerlyBot';

/**
 * Normalizes a rule path for prefix/wildcard comparison
 */
function matchesPath(rulePath, targetPath) {
  if (!rulePath) return false;
  if (rulePath === '/') return true;

  // Convert standard robots.txt pattern to RegExp
  // Escapes regex chars except * and trailing $
  let regexPattern = rulePath
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');

  if (regexPattern.endsWith('\\$')) {
    regexPattern = regexPattern.slice(0, -2) + '$';
  }

  try {
    const re = new RegExp('^' + regexPattern);
    return re.test(targetPath);
  } catch (e) {
    return targetPath.startsWith(rulePath);
  }
}

/**
 * Parses raw robots.txt content into structured rules for CareerlyBot and wildcard (*)
 */
export function parseRobotsTxt(content = '') {
  const lines = content.split(/\r?\n/);
  const userAgentGroups = [];
  let currentGroup = null;

  for (let rawLine of lines) {
    // Strip comments
    const hashIdx = rawLine.indexOf('#');
    if (hashIdx !== -1) {
      rawLine = rawLine.slice(0, hashIdx);
    }
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();

    if (field === 'user-agent') {
      const ua = value.toLowerCase();
      // If previous group had directives, start a new group; otherwise add to current
      if (currentGroup && (currentGroup.rules.length > 0 || currentGroup.crawlDelay !== null)) {
        userAgentGroups.push(currentGroup);
        currentGroup = null;
      }
      if (!currentGroup) {
        currentGroup = { agents: [], rules: [], crawlDelay: null };
      }
      currentGroup.agents.push(ua);
    } else if (currentGroup) {
      if (field === 'disallow') {
        currentGroup.rules.push({ type: 'disallow', path: value });
      } else if (field === 'allow') {
        currentGroup.rules.push({ type: 'allow', path: value });
      } else if (field === 'crawl-delay') {
        const delaySec = parseFloat(value);
        if (!isNaN(delaySec) && delaySec >= 0) {
          currentGroup.crawlDelay = delaySec * 1000;
        }
      }
    }
  }

  if (currentGroup) {
    userAgentGroups.push(currentGroup);
  }

  // Find best matching group for CareerlyBot (specific first, fallback to *)
  let specificGroup = null;
  let wildcardGroup = null;

  for (const group of userAgentGroups) {
    if (group.agents.includes(BOT_NAME.toLowerCase())) {
      specificGroup = group;
      break;
    }
    if (group.agents.includes('*')) {
      wildcardGroup = group;
    }
  }

  const effectiveGroup = specificGroup || wildcardGroup || { rules: [], crawlDelay: null };

  return {
    matchedAgent: specificGroup ? BOT_NAME : (wildcardGroup ? '*' : 'none'),
    rules: effectiveGroup.rules,
    crawlDelayMs: effectiveGroup.crawlDelay
  };
}

/**
 * Fetches and caches robots.txt for a given origin
 */
export async function getRobotsRulesForOrigin(origin) {
  const cached = ROBOTS_CACHE.get(origin);
  const now = Date.now();

  if (cached && (now - cached.parsedAt < CACHE_TTL_MS)) {
    return cached;
  }

  const robotsUrl = `${origin}/robots.txt`;

  try {
    const response = await safeFetch(robotsUrl, {
      timeout: 8000,
      headers: {
        'User-Agent': `${BOT_NAME}/2.0 (+https://careerly-finder.pages.dev/bot; compliance@careerly.app)`,
        'Accept': 'text/plain, */*'
      }
    });

    if (response && response.status === 200 && typeof response.data === 'string') {
      const parsed = parseRobotsTxt(response.data);
      const cacheEntry = {
        parsedAt: now,
        rules: parsed.rules,
        crawlDelayMs: parsed.crawlDelayMs,
        matchedAgent: parsed.matchedAgent,
        status: 200
      };
      ROBOTS_CACHE.set(origin, cacheEntry);
      return cacheEntry;
    }

    // 404 or missing robots.txt -> Allow everything (standard RFC 9309 behavior)
    const emptyEntry = {
      parsedAt: now,
      rules: [],
      crawlDelayMs: null,
      matchedAgent: 'none',
      status: response ? response.status : 404
    };
    ROBOTS_CACHE.set(origin, emptyEntry);
    return emptyEntry;

  } catch (err) {
    // If robots.txt returns 404 or connection error, default to allowed with empty rules
    const fallbackEntry = {
      parsedAt: now,
      rules: [],
      crawlDelayMs: null,
      matchedAgent: 'none',
      status: 0,
      error: err.message
    };
    // Cache for a shorter duration (1 hour) on transient network failures
    ROBOTS_CACHE.set(origin, { ...fallbackEntry, parsedAt: now - (CACHE_TTL_MS - 3600000) });
    return fallbackEntry;
  }
}

/**
 * Checks if a specific URL is permitted to be crawled according to robots.txt
 * 
 * @param {string} targetUrl - Full URL to evaluate (e.g. "https://example.com/jobs/123")
 * @param {string} [userAgent='CareerlyBot'] - Target bot identifier
 * @returns {Promise<{ allowed: boolean, reason: string, crawlDelayMs: number | null }>}
 */
export async function isUrlAllowed(targetUrl, userAgent = BOT_NAME) {
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (e) {
    return { allowed: false, reason: 'Invalid URL format', crawlDelayMs: null };
  }

  // Only check HTTP / HTTPS protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { allowed: false, reason: 'Unsupported scheme for robots check', crawlDelayMs: null };
  }

  const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const path = parsedUrl.pathname + parsedUrl.search;

  const robots = await getRobotsRulesForOrigin(origin);

  if (!robots || !robots.rules || robots.rules.length === 0) {
    return {
      allowed: true,
      reason: 'No restrictive robots.txt rules found',
      crawlDelayMs: robots?.crawlDelayMs || null
    };
  }

  // Evaluate rules in order. RFC 9309: Most specific match takes precedence; 
  // on equal length, Allow takes precedence over Disallow.
  let matchedRule = null;
  let maxMatchLength = -1;

  for (const rule of robots.rules) {
    if (!rule.path) {
      // Disallow: with empty path means allow everything
      if (rule.type === 'disallow' && maxMatchLength < 0) {
        matchedRule = { type: 'allow', path: '' };
      }
      continue;
    }

    if (matchesPath(rule.path, path)) {
      if (rule.path.length > maxMatchLength) {
        maxMatchLength = rule.path.length;
        matchedRule = rule;
      } else if (rule.path.length === maxMatchLength && rule.type === 'allow') {
        matchedRule = rule; // Allow wins ties
      }
    }
  }

  if (matchedRule && matchedRule.type === 'disallow') {
    return {
      allowed: false,
      reason: `Blocked by robots.txt directive: Disallow: ${matchedRule.path} (Agent: ${robots.matchedAgent})`,
      crawlDelayMs: robots.crawlDelayMs
    };
  }

  return {
    allowed: true,
    reason: matchedRule ? `Explicitly allowed by Allow: ${matchedRule.path}` : 'Allowed (no matching disallow rule)',
    crawlDelayMs: robots.crawlDelayMs
  };
}

/**
 * Returns the crawl delay specified by the domain's robots.txt, if any
 */
export async function getCrawlDelay(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const robots = await getRobotsRulesForOrigin(origin);
    return robots?.crawlDelayMs || null;
  } catch (e) {
    return null;
  }
}

/**
 * Clear cache (used primarily for unit tests)
 */
export function clearRobotsCache() {
  ROBOTS_CACHE.clear();
}

export default {
  parseRobotsTxt,
  getRobotsRulesForOrigin,
  isUrlAllowed,
  getCrawlDelay,
  clearRobotsCache
};
