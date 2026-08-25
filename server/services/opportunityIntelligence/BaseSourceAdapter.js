import { safeFetch } from '../safeHttpClient.js';
import crypto from 'crypto';

/**
 * Base Source Adapter Interface & Common Foundation
 * All source adapters (Greenhouse, Lever, SmartRecruiters, Academic Feeds, Composio) inherit from this.
 */
export class BaseSourceAdapter {
  constructor({
    sourceId,
    sourceName,
    domain,
    type = 'ats',
    tier = 1,
    rateLimitMs = 1500,
    authorityLevel = 1,
    trustScore = 95
  }) {
    this.sourceId = sourceId;
    this.sourceName = sourceName;
    this.domain = domain;
    this.type = type;
    this.tier = tier;
    this.rateLimitMs = rateLimitMs;
    this.authorityLevel = authorityLevel;
    this.trustScore = trustScore;
  }

  /**
   * Validate adapter-specific configuration parameters
   */
  validateConfiguration(config = {}) {
    return { valid: true };
  }

  /**
   * SSRF-Safe HTTP Fetch via safeFetch
   */
  async fetch(url, options = {}) {
    const headers = {
      'User-Agent': 'Careerly-Intelligence-Ingestion-Bot/2.0 (+https://careerly.app/bot)',
      'Accept': 'application/json, text/html, application/xml;q=0.9, */*;q=0.8',
      ...(options.headers || {})
    };

    const timeout = options.timeout || 12000;
    return await safeFetch(url, { ...options, headers, timeout });
  }

  /**
   * Extract raw opportunity records from source response
   * @param {Object} rawPayload - Raw response from source
   * @returns {Array<Object>} List of raw items
   */
  async parse(rawPayload) {
    throw new Error(`[${this.sourceName}] parse() must be implemented by adapter subclass.`);
  }

  /**
   * Normalize a raw item into Careerly's canonical opportunity structure
   * @param {Object} rawItem - Single raw item from parse()
   * @param {string} runId - Current ScrapeRun UUID
   * @returns {Object} Normalized opportunity record
   */
  normalize(rawItem, runId = null) {
    throw new Error(`[${this.sourceName}] normalize() must be implemented by adapter subclass.`);
  }

  /**
   * Validate normalized opportunity against required structural invariants
   * @param {Object} item - Normalized opportunity
   * @returns {{ valid: boolean, errors: Array<string> }}
   */
  validate(item) {
    const errors = [];
    if (!item) {
      errors.push('Item is null or undefined');
      return { valid: false, errors };
    }

    if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
      errors.push('Missing or empty title');
    }

    const company = item.company || item.organization;
    if (!company || typeof company !== 'string' || company.trim().length === 0) {
      errors.push('Missing or empty company/organization');
    }

    const applyUrl = item.official_apply_url || item.source_url;
    if (!applyUrl || typeof applyUrl !== 'string' || !applyUrl.startsWith('http')) {
      errors.push('Missing or invalid application/source URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Returns rate limit delay in milliseconds
   */
  getRateLimit() {
    return this.rateLimitMs;
  }

  /**
   * Check if adapter supports a given opportunity type ('job', 'internship', 'scholarship', 'fellowship')
   */
  supports(type = 'all') {
    if (!type || type === 'all') return true;
    return true;
  }
}

export default BaseSourceAdapter;
