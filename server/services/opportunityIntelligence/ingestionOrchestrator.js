import crypto from 'crypto';
import db from '../../db/sqliteClient.js';
import { getAdapterForSource } from './sourceRegistry.js';
import { normalizeRawOpportunity } from './normalizer.js';
import { enrichWithAiAssist } from './aiExtractor.js';
import { deduplicateAndMergeOpportunity } from './deduplicator.js';

// Active run cancellations map
const activeCancellations = new Set();

/**
 * Trigger background execution of a ScrapeRun
 */
export async function executeScrapeRun(runId) {
  const run = db.prepare('SELECT * FROM scrape_runs WHERE id = ?').get(runId);
  if (!run) return;

  const startTime = Date.now();
  db.prepare("UPDATE scrape_runs SET status = 'RUNNING', started_at = CURRENT_TIMESTAMP WHERE id = ?").run(runId);

  let config = {};
  try {
    config = JSON.parse(run.configuration_json || '{}');
  } catch (e) {}

  // Resolve sources to scrape
  let selectedSourceIds = Array.isArray(config.selected_sources) && config.selected_sources.length > 0
    ? config.selected_sources
    : null;

  let sourcesToScrape = [];
  if (selectedSourceIds) {
    const placeholders = selectedSourceIds.map(() => '?').join(',');
    sourcesToScrape = db.prepare(`SELECT * FROM sources WHERE id IN (${placeholders}) AND enabled = 1`).all(...selectedSourceIds);
  } else {
    // Ingest across all enabled approved sources (ATS, Serper Google Jobs, Academic, and Composio)
    sourcesToScrape = db.prepare(`
      SELECT * FROM sources 
      WHERE enabled = 1 
      ORDER BY 
        CASE 
          WHEN adapter = 'serper' THEN 1
          WHEN adapter = 'greenhouse' THEN 2
          WHEN adapter = 'lever' THEN 3
          WHEN adapter = 'smartrecruiters' THEN 4
          ELSE 5
        END ASC,
        tier ASC
    `).all();
  }

  let sourcesAttempted = 0;
  let sourcesSucceeded = 0;
  let sourcesFailed = 0;
  let pagesScanned = 0;
  let recordsFound = 0;
  let recordsNormalized = 0;
  let recordsValidated = 0;
  let duplicates = 0;
  let rejected = 0;
  const errors = [];

  console.log(`[Ingestion Orchestrator] Starting ScrapeRun ${runId} across ${sourcesToScrape.length} sources...`);

  for (const sourceRecord of sourcesToScrape) {
    // Yield event loop between sources to keep server responsive
    await new Promise(resolve => setImmediate(resolve));

    if (activeCancellations.has(runId)) {
      console.log(`[Ingestion Orchestrator] Run ${runId} was cancelled.`);
      activeCancellations.delete(runId);
      db.prepare(`
        UPDATE scrape_runs 
        SET status = 'CANCELLED', 
            completed_at = CURRENT_TIMESTAMP,
            duration_ms = ?
        WHERE id = ?
      `).run(Date.now() - startTime, runId);
      return;
    }

    sourcesAttempted++;
    const adapter = getAdapterForSource(sourceRecord);

    if (!adapter) {
      sourcesFailed++;
      errors.push({ source: sourceRecord.name, error: 'Adapter not found' });
      continue;
    }

    try {
      console.log(`[Ingestion Orchestrator] Executing adapter: ${adapter.sourceName}...`);
      const rawItems = await adapter.parse();
      pagesScanned++;
      const itemCount = Array.isArray(rawItems) ? rawItems.length : 0;
      recordsFound += itemCount;

      let sourceNormalized = 0;

      for (const raw of rawItems) {
        if (config.max_records && recordsValidated >= config.max_records) {
          break;
        }

        // Periodic event loop yield for high-volume batches
        if (recordsNormalized % 20 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }

        const rawRecordId = `raw-${crypto.randomUUID().slice(0, 10)}`;
        const extId = String(raw.id || raw.external_id || '');
        const sourceUrl = raw.url || raw.source_url || raw.absolute_url || sourceRecord.base_url;

        // 1. Persist raw unstructured payload
        db.prepare(`
          INSERT INTO raw_source_records (
            id, scrape_run_id, source_id, external_id, source_url,
            raw_payload, normalization_status, scraped_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
        `).run(rawRecordId, runId, sourceRecord.id, extId, sourceUrl, JSON.stringify(raw));

        // 2. Normalization
        let normalized = null;
        try {
          normalized = adapter.normalize(raw, runId);
        } catch (normErr) {
          normalized = normalizeRawOpportunity(raw, sourceRecord, runId);
        }

        if (!normalized) {
          rejected++;
          db.prepare("UPDATE raw_source_records SET normalization_status = 'REJECTED' WHERE id = ?").run(rawRecordId);
          continue;
        }

        recordsNormalized++;
        sourceNormalized++;

        // 3. AI-assisted enrichment for missing fields if enabled
        let aiStatus = 'SKIPPED';
        if (config.use_ai !== false) {
          const aiRes = await enrichWithAiAssist(normalized);
          normalized = aiRes.enriched;
          aiStatus = ['NONE', 'SUCCESS', 'SKIPPED', 'FAILED'].includes(aiRes?.status) ? aiRes.status : 'SKIPPED';
        }

        // 4. Schema Validation
        const validation = adapter.validate(normalized);
        if (!validation.valid) {
          rejected++;
          db.prepare(`
            UPDATE raw_source_records 
            SET normalization_status = 'NEEDS_REVIEW',
                validation_errors_json = ?,
                ai_extraction_status = ?
            WHERE id = ?
          `).run(JSON.stringify(validation.errors), aiStatus, rawRecordId);
          continue;
        }

        recordsValidated++;
        db.prepare(`
          UPDATE raw_source_records 
          SET normalization_status = 'VALIDATED',
              ai_extraction_status = ?
          WHERE id = ?
        `).run(aiStatus, rawRecordId);

        // 5. Deduplication
        const dedupResult = deduplicateAndMergeOpportunity(normalized);
        if (dedupResult.isDuplicate) {
          duplicates++;
          continue;
        }

        // 6. Persistence into SQLite Canonical Opportunities Table
        try {
          db.prepare(`
            INSERT OR REPLACE INTO opportunities (
              id, source_id, source_name, source_type, external_id, source_url,
              title, normalized_title, company, normalized_company, organization,
              description, opportunity_type, employment_type, location_country,
              location_city, location_raw, normalized_location, is_remote, work_mode,
              stipend_text, is_paid, skills_required, skills_preferred, posted_at,
              deadline_utc, job_page_url, official_apply_url, official_program_url,
              application_url_type, contact_email, source_tier, source_authority_level,
              trust_score, confidence_score, verification_level, verification_status,
              status, lifecycle_status, first_seen_at, last_seen_at, last_verified_at,
              scrape_run_id, raw_data, created_at, updated_at
            ) VALUES (
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?,
              ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `).run(
            normalized.id,
            normalized.source_id,
            normalized.source_name,
            normalized.source_type,
            normalized.external_id,
            normalized.source_url,
            normalized.title,
            normalized.normalized_title,
            normalized.company,
            normalized.normalized_company,
            normalized.organization,
            normalized.description,
            normalized.opportunity_type,
            normalized.employment_type,
            normalized.location_country,
            normalized.location_city,
            normalized.location_raw,
            normalized.normalized_location,
            normalized.is_remote,
            normalized.work_mode,
            normalized.stipend_text,
            normalized.is_paid,
            normalized.skills_required,
            normalized.skills_preferred,
            normalized.posted_at,
            normalized.deadline_utc,
            normalized.job_page_url,
            normalized.official_apply_url,
            normalized.official_program_url,
            normalized.application_url_type,
            normalized.contact_email,
            normalized.source_tier,
            normalized.source_authority_level,
            normalized.trust_score,
            normalized.confidence_score,
            normalized.verification_level,
            normalized.verification_status,
            normalized.status,
            normalized.lifecycle_status,
            normalized.first_seen_at,
            normalized.last_seen_at,
            normalized.last_verified_at,
            normalized.scrape_run_id,
            normalized.raw_data
          );
        } catch (insertErr) {
          console.warn(`[Ingestion Orchestrator] Opportunity insert note (${normalized.id}):`, insertErr.message);
          rejected++;
          continue;
        }
      }

      sourcesSucceeded++;
      // Update source health and counters
      db.prepare(`
        UPDATE sources 
        SET last_scraped_at = CURRENT_TIMESTAMP,
            last_success_at = CURRENT_TIMESTAMP,
            consecutive_failures = 0,
            health_status = 'HEALTHY',
            last_error = NULL,
            records_found_total = records_found_total + ?,
            records_normalized_total = records_normalized_total + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(itemCount, sourceNormalized, sourceRecord.id);

    } catch (err) {
      sourcesFailed++;
      errors.push({ source: sourceRecord.name, error: err.message });
      console.warn(`[Ingestion Orchestrator] Source ${sourceRecord.name} error:`, err.message);

      // Increment source failure telemetry
      db.prepare(`
        UPDATE sources
        SET last_failed_at = CURRENT_TIMESTAMP,
            consecutive_failures = consecutive_failures + 1,
            last_error = ?,
            health_status = CASE WHEN consecutive_failures >= 3 THEN 'FAILING' ELSE 'DEGRADED' END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(err.message, sourceRecord.id);
    }

    // Rate-limiting delay between sources
    if (adapter.getRateLimit() > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(adapter.getRateLimit(), 2000)));
    }
  }

  const durationMs = Date.now() - startTime;
  let finalStatus = 'COMPLETED';
  if (sourcesFailed > 0 && sourcesSucceeded > 0) {
    finalStatus = 'PARTIAL';
  } else if (sourcesFailed > 0 && sourcesSucceeded === 0) {
    finalStatus = 'FAILED';
  }

  db.prepare(`
    UPDATE scrape_runs
    SET status = ?,
        completed_at = CURRENT_TIMESTAMP,
        sources_attempted = ?,
        sources_succeeded = ?,
        sources_failed = ?,
        pages_scanned = ?,
        records_found = ?,
        records_normalized = ?,
        records_validated = ?,
        duplicates = ?,
        rejected = ?,
        errors_json = ?,
        duration_ms = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    finalStatus,
    sourcesAttempted,
    sourcesSucceeded,
    sourcesFailed,
    pagesScanned,
    recordsFound,
    recordsNormalized,
    recordsValidated,
    duplicates,
    rejected,
    JSON.stringify(errors),
    durationMs,
    runId
  );

  console.log(`[Ingestion Orchestrator] Run ${runId} finished in ${durationMs}ms with status ${finalStatus}. Validated +${recordsValidated}, Duplicates: ${duplicates}, Errors: ${errors.length}.`);
}

/**
 * Queue a new scrape run and trigger background execution
 */
export function queueScrapeRun({ adminId, configuration = {}, jobId = null }) {
  const runId = `run-${crypto.randomUUID().slice(0, 10)}`;

  db.prepare(`
    INSERT INTO scrape_runs (
      id, job_id, admin_id, configuration_json, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'QUEUED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(runId, jobId, adminId, JSON.stringify(configuration));

  // Trigger asynchronously without blocking HTTP response
  setImmediate(() => {
    executeScrapeRun(runId).catch(err => {
      console.error(`[Ingestion Orchestrator] Unhandled run ${runId} error:`, err);
    });
  });

  return runId;
}

/**
 * Cancel an active scrape run
 */
export function cancelScrapeRun(runId) {
  activeCancellations.add(runId);
  return true;
}

export default {
  executeScrapeRun,
  queueScrapeRun,
  cancelScrapeRun
};
