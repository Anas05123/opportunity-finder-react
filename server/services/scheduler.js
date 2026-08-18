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

      const { newCount, updatedCount, duplicateCount } = processAndDeduplicate(extracted);

      totalNew += newCount;
      totalUpdated += updatedCount;
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

      console.log(`[+] [${adapter.sourceName}] Ingestion complete: +${newCount} new, ${updatedCount} updated, ${duplicateCount} duplicates deduplicated.`);
    } catch (err) {
      console.error(`[-] [${adapter.sourceName}] Scraper error:`, err.message);
    }
  }

  console.log(`[SCHEDULER COMPLETE] Multi-source ingestion finished: Total +${totalNew} new opportunities indexed, ${totalDuplicates} duplicates canonicalized.`);
  return { totalNew, totalUpdated, totalDuplicates };
}

export function startBackgroundScheduler(intervalMinutes = 120) {
  console.log(`[SCHEDULER] Automated 24/7 background scheduler initialized. Ingestion loop every ${intervalMinutes} minutes.`);
  
  // Run once immediately
  runScraperPipeline().catch(console.error);

  // Schedule recurring loop
  setInterval(() => {
    runScraperPipeline().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}
