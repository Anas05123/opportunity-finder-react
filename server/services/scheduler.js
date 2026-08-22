import db from '../db/database.js';
import { DaadAdapter } from './scrapers/DaadAdapter.js';
import { EuraxessAdapter } from './scrapers/EuraxessAdapter.js';
import { UnCareersAdapter } from './scrapers/UnCareersAdapter.js';
import { OpportunityDeskAdapter, OpportunitiesCircleAdapter } from './scrapers/AggregatorAdapters.js';
import { GovernmentScholarshipsAdapter } from './scrapers/GovernmentScholarshipsAdapter.js';
import { InternationalOrgsAdapter, UniversityExcellenceAdapter } from './scrapers/MajorInstitutesAdapters.js';
import { LinkedInInternshipsAdapter } from './scrapers/LinkedInInternshipsAdapter.js';
import { processAndDeduplicate } from './deduplicator.js';

const adapters = [
  new LinkedInInternshipsAdapter(),
  new GovernmentScholarshipsAdapter(),
  new InternationalOrgsAdapter(),
  new UniversityExcellenceAdapter(),
  new DaadAdapter(),
  new EuraxessAdapter(),
  new UnCareersAdapter(),
  new OpportunityDeskAdapter(),
  new OpportunitiesCircleAdapter()
];

export async function runScraperPipeline() {
  console.log(`[SCHEDULER] Starting automated ingestion run across ${adapters.length} registered scraper adapter suites...`);

  let totalNew = 0;
  let totalUpdated = 0;
  let totalDuplicates = 0;

  for (const adapter of adapters) {
    try {
      console.log(`[*] Scraping source adapter: ${adapter.sourceName}...`);
      const extracted = await adapter.parse();

      const dedupResult = processAndDeduplicate(extracted || []);
      const uniqueCount = Array.isArray(dedupResult?.unique) ? dedupResult.unique.length : 0;
      const duplicateCount = dedupResult?.duplicatesCount || 0;

      totalNew += uniqueCount;
      totalDuplicates += duplicateCount;

      db.upsertSource({
        id: adapter.sourceId,
        name: adapter.sourceName,
        domain: adapter.domain,
        tier: adapter.tier,
        status: 'active',
        last_scraped_at: new Date().toISOString(),
        last_success_at: new Date().toISOString()
      });

      console.log(`[+] [${adapter.sourceName}] Ingestion complete: +${uniqueCount} new, ${duplicateCount} duplicates deduplicated.`);
    } catch (err) {
      console.error(`[-] [${adapter.sourceName}] Scraper error:`, err.message);
    }
  }

  console.log(`[SCHEDULER COMPLETE] Multi-source ingestion finished: Total +${totalNew} new opportunities indexed, ${totalDuplicates} duplicates canonicalized.`);
  return { totalNew, totalUpdated, totalDuplicates };
}

/**
 * Run periodic operational security health check
 */
export async function runOperationalSecurityHealthCheck() {
  try {
    const sqliteClientModule = await import('../db/sqliteClient.js');
    const db = sqliteClientModule.default;
    
    const latestRun = db.prepare(`
      SELECT id, score, status, completed_at, started_at
      FROM security_audit_runs
      WHERE status != 'IN_PROGRESS'
      ORDER BY completed_at DESC, rowid DESC
      LIMIT 1
    `).get();

    if (latestRun) {
      const completedTime = new Date(latestRun.completed_at || latestRun.started_at).getTime();
      const ageHours = (Date.now() - completedTime) / (1000 * 60 * 60);

      const { triggerSecurityAlert } = await import('./security/securityAlerts.js');

      if (latestRun.status === 'CRITICAL') {
        await triggerSecurityAlert({
          alert_type: 'CRITICAL_SECURITY_SCORE',
          severity: 'CRITICAL',
          title: 'Critical Security Posture Detected',
          summary: `Authoritative security score is CRITICAL (${latestRun.score}/100).`,
          source: 'OPERATIONAL_SCHEDULER',
          details: { audit_id: latestRun.id, score: latestRun.score, status: latestRun.status }
        });
      } else if (ageHours > 24) {
        await triggerSecurityAlert({
          alert_type: 'SECURITY_VERIFICATION_OUTDATED',
          severity: 'HIGH',
          title: 'Security Verification Outdated',
          summary: `Latest security verification is ${Math.round(ageHours)} hours old (exceeds 24h freshness window).`,
          source: 'OPERATIONAL_SCHEDULER',
          details: { audit_id: latestRun.id, age_hours: Math.round(ageHours) }
        });
      }
    }
  } catch (err) {
    console.error('[SCHEDULER] Operational security check error:', err.message);
  }
}

export function startBackgroundScheduler(intervalMinutes = 120) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_AUTO_SCRAPE === 'true') {
    console.log('[SCHEDULER] Automated background scheduler suspended for testing environment.');
    return;
  }
  console.log(`[SCHEDULER] Automated 24/7 background scheduler initialized. Ingestion loop every ${intervalMinutes} minutes.`);
  
  // Run once immediately
  runScraperPipeline().catch(err => console.error('[SCHEDULER] Pipeline initial run warning:', err.message));
  runOperationalSecurityHealthCheck().catch(err => console.error('[SCHEDULER] Security health check initial warning:', err.message));

  // Schedule recurring loop
  setInterval(() => {
    runScraperPipeline().catch(err => console.error('[SCHEDULER] Pipeline scheduled run warning:', err.message));
    runOperationalSecurityHealthCheck().catch(err => console.error('[SCHEDULER] Security health check scheduled warning:', err.message));
  }, intervalMinutes * 60 * 1000);
}
