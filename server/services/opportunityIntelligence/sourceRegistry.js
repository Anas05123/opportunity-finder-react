import db from '../../db/sqliteClient.js';
import { GreenhouseAdapter } from './adapters/GreenhouseAdapter.js';
import { LeverAdapter } from './adapters/LeverAdapter.js';
import { SmartRecruitersAdapter } from './adapters/SmartRecruitersAdapter.js';
import { PublicAcademicAdapter } from './adapters/PublicAcademicAdapter.js';
import { SerperJobsAdapter } from './adapters/SerperJobsAdapter.js';
import { ComposioToolAdapter } from './adapters/ComposioToolAdapter.js';

/**
 * Standard Approved Source Registry & Adapter Factory
 */
export const APPROVED_SOURCE_CATALOG = [
  // 1. Official Greenhouse ATS Boards
  { id: 'gh-cloudflare', name: 'Cloudflare Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'cloudflare', companyName: 'Cloudflare' } },
  { id: 'gh-figma', name: 'Figma Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/figma/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'figma', companyName: 'Figma' } },
  { id: 'gh-stripe', name: 'Stripe Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'stripe', companyName: 'Stripe' } },
  { id: 'gh-reddit', name: 'Reddit Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/reddit/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'reddit', companyName: 'Reddit' } },
  { id: 'gh-discord', name: 'Discord Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/discord/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'discord', companyName: 'Discord' } },
  { id: 'gh-hubspot', name: 'HubSpot Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/hubspot/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'hubspot', companyName: 'HubSpot' } },
  { id: 'gh-dropbox', name: 'Dropbox Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/dropbox/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'dropbox', companyName: 'Dropbox' } },
  { id: 'gh-airbnb', name: 'Airbnb Careers', domain: 'boards-api.greenhouse.io', base_url: 'https://boards-api.greenhouse.io/v1/boards/airbnb/jobs', tier: 1, type: 'ats', adapter: 'greenhouse', country: 'Global', trust_score: 99, config: { boardToken: 'airbnb', companyName: 'Airbnb' } },

  // 2. Official Lever ATS Feeds
  { id: 'lever-spotify', name: 'Spotify Careers', domain: 'api.lever.co', base_url: 'https://api.lever.co/v0/postings/spotify?mode=json', tier: 1, type: 'ats', adapter: 'lever', country: 'Global', trust_score: 99, config: { companySlug: 'spotify', companyName: 'Spotify' } },
  { id: 'lever-coupa', name: 'Coupa Software', domain: 'api.lever.co', base_url: 'https://api.lever.co/v0/postings/coupa?mode=json', tier: 1, type: 'ats', adapter: 'lever', country: 'Global', trust_score: 98, config: { companySlug: 'coupa', companyName: 'Coupa' } },
  { id: 'lever-anchorage', name: 'Anchorage Digital', domain: 'api.lever.co', base_url: 'https://api.lever.co/v0/postings/anchorage?mode=json', tier: 1, type: 'ats', adapter: 'lever', country: 'Global', trust_score: 98, config: { companySlug: 'anchorage', companyName: 'Anchorage' } },

  // 3. Official SmartRecruiters Feeds
  { id: 'sr-visa', name: 'Visa Careers', domain: 'api.smartrecruiters.com', base_url: 'https://api.smartrecruiters.com/v1/companies/visa/postings', tier: 1, type: 'ats', adapter: 'smartrecruiters', country: 'Global', trust_score: 98, config: { companyIdentifier: 'visa', companyName: 'Visa' } },
  { id: 'sr-ikea', name: 'IKEA Global Careers', domain: 'api.smartrecruiters.com', base_url: 'https://api.smartrecruiters.com/v1/companies/ikea/postings', tier: 1, type: 'ats', adapter: 'smartrecruiters', country: 'Global', trust_score: 98, config: { companyIdentifier: 'ikea', companyName: 'IKEA' } },

  // 4. Official Government, Academic & Fellowship Portals
  { id: 'daad-germany', name: 'DAAD German Academic Exchange Service', domain: 'daad.de', base_url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', tier: 1, type: 'feed', adapter: 'academic', country: 'Germany', trust_score: 99, config: { sourceId: 'daad-germany', sourceName: 'DAAD Germany', domain: 'daad.de', baseUrl: 'https://www.daad.de', country: 'Germany', defaultType: 'scholarship' } },
  { id: 'euraxess-eu', name: 'EURAXESS European Research Fellowships', domain: 'euraxess.ec.europa.eu', base_url: 'https://euraxess.ec.europa.eu/jobs', tier: 1, type: 'feed', adapter: 'academic', country: 'European Union', trust_score: 99, config: { sourceId: 'euraxess-eu', sourceName: 'EURAXESS Europe', domain: 'euraxess.ec.europa.eu', baseUrl: 'https://euraxess.ec.europa.eu', country: 'European Union', defaultType: 'fellowship' } },
  { id: 'un-careers', name: 'United Nations Careers & Internships', domain: 'careers.un.org', base_url: 'https://careers.un.org', tier: 1, type: 'feed', adapter: 'academic', country: 'Global', trust_score: 99, config: { sourceId: 'un-careers', sourceName: 'United Nations', domain: 'careers.un.org', baseUrl: 'https://careers.un.org', country: 'Global', defaultType: 'internship' } },
  { id: 'chevening-uk', name: 'Chevening UK Government Scholarships', domain: 'chevening.org', base_url: 'https://www.chevening.org/scholarships/', tier: 1, type: 'feed', adapter: 'academic', country: 'United Kingdom', trust_score: 99, config: { sourceId: 'chevening-uk', sourceName: 'Chevening Scholarships UK', domain: 'chevening.org', baseUrl: 'https://www.chevening.org', country: 'United Kingdom', defaultType: 'scholarship' } },
  { id: 'mext-japan', name: 'MEXT Japanese Government Scholarship', domain: 'studyinjapan.go.jp', base_url: 'https://www.studyinjapan.go.jp/en/planning/scholarship/', tier: 1, type: 'feed', adapter: 'academic', country: 'Japan', trust_score: 99, config: { sourceId: 'mext-japan', sourceName: 'MEXT Japan', domain: 'studyinjapan.go.jp', baseUrl: 'https://www.studyinjapan.go.jp', country: 'Japan', defaultType: 'scholarship' } },

  // 5. Composio Tool Integrations
  { id: 'composio-google', name: 'Google Careers (Composio Integration)', domain: 'careers.google.com', base_url: 'https://careers.google.com', tier: 2, type: 'composio', adapter: 'composio', country: 'Global', trust_score: 96, config: { sourceId: 'composio-google', sourceName: 'Google Careers', domain: 'careers.google.com', targetUrl: 'https://careers.google.com' } },
  { id: 'composio-apple', name: 'Apple Careers (Composio Integration)', domain: 'jobs.apple.com', base_url: 'https://jobs.apple.com', tier: 2, type: 'composio', adapter: 'composio', country: 'Global', trust_score: 96, config: { sourceId: 'composio-apple', sourceName: 'Apple Careers', domain: 'jobs.apple.com', targetUrl: 'https://jobs.apple.com' } }
];

/**
 * Initialize / Seed standard source registry in SQLite
 */
export function seedSourceRegistry() {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO sources (
      id, name, type, adapter, domain, base_url, tier, trust_score,
      access_method, country, status, enabled, rate_limit_ms, health_status,
      scrape_frequency_minutes, config_json, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, 'active', 1, 1500, 'HEALTHY',
      240, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `);

  const tx = db.transaction((catalog) => {
    for (const src of catalog) {
      insertStmt.run(
        src.id,
        src.name,
        src.type || 'ats',
        src.adapter || 'greenhouse',
        src.domain,
        src.base_url,
        src.tier || 1,
        src.trust_score || 95,
        src.type === 'ats' || src.type === 'api' ? 'api' : 'html',
        src.country || 'Global',
        JSON.stringify(src.config || {})
      );
    }
  });

  try {
    tx(APPROVED_SOURCE_CATALOG);
    console.log(`[Source Registry] Verified ${APPROVED_SOURCE_CATALOG.length} approved sources in SQLite registry.`);
  } catch (e) {
    console.warn('[Source Registry] Seed note:', e.message);
  }
}

/**
 * Instantiate Adapter for a registered source
 */
export function getAdapterForSource(sourceRecord) {
  if (!sourceRecord) return null;

  let config = {};
  try {
    config = typeof sourceRecord.config_json === 'string' ? JSON.parse(sourceRecord.config_json) : (sourceRecord.config_json || {});
  } catch (e) {}

  switch (sourceRecord.adapter) {
    case 'greenhouse':
      return new GreenhouseAdapter(config);
    case 'lever':
      return new LeverAdapter(config);
    case 'smartrecruiters':
      return new SmartRecruitersAdapter(config);
    case 'academic':
      return new PublicAcademicAdapter(config);
    case 'serper':
      return new SerperJobsAdapter(config);
    case 'composio':
      return new ComposioToolAdapter(config);
    default:
      return new GreenhouseAdapter(config);
  }
}

/**
 * Enforce source allowlisting: check if a target is an approved source
 */
export function isSourceAllowed(sourceId) {
  const row = db.prepare('SELECT id, enabled FROM sources WHERE id = ?').get(sourceId);
  return Boolean(row && (row.enabled === 1 || row.enabled === '1'));
}

export default {
  APPROVED_SOURCE_CATALOG,
  seedSourceRegistry,
  getAdapterForSource,
  isSourceAllowed
};
