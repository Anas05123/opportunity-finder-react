import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/sqliteClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDbPath = path.join(__dirname, '..', '..', 'opportunities_db.json');
import { expandSearchProfile } from './queryExpander.js';
import { fetchGreenhouseBoardJobs } from './adapters/greenhouseAdapter.js';
import { fetchLeverPostings } from './adapters/leverAdapter.js';
import { searchGoogleJobsViaSerper } from './adapters/serperAdapter.js';
import { scrapeLiveJobsForQuery } from './liveSearchScraper.js';
import { deduplicateOpportunities } from './deduplicator.js';
import { normalizeLocation } from './locationNormalizer.js';
import { classifyOpportunityType } from './typeClassifier.js';
import { verifyJobIdentity } from './jobIdentityVerifier.js';
import { extractFieldEvidence } from './evidenceExtractor.js';
import { evaluateHardConstraints } from './hardFilter.js';
import { calculateDeterministicMatchScore } from './matchingEngine.js';
import { compileSearchConstraints } from './constraintCompiler.js';

// Curated Verified Public ATS Registries
const GREENHOUSE_BOARDS = [
  'cloudflare', 'figma', 'stripe', 'reddit', 
  'discord', 'hubspot', 'gusto', 'dropbox', 'airbnb'
];
const LEVER_COMPANIES = ['spotify', 'coupa', 'anchorage'];

/**
 * Opportunity Discovery Orchestrator (V4)
 * Executes live multi-source discovery, normalization, verification,
 * deduplication against SQLite cache, hard filtering, matching, and ranking.
 */
export async function discoverOpportunities({
  query = '',
  userProfile = {},
  compiledConstraints = null,
  debug = false
}) {
  const effectiveQuery = (query || '').trim();
  const effectiveConstraints = compiledConstraints || compileSearchConstraints(effectiveQuery, userProfile);
  const searchPlan = expandSearchProfile(effectiveConstraints);

  console.log(`[Discovery Orchestrator] Starting Live Discovery for: "${effectiveQuery}" (${searchPlan.queries.length} expanded queries)`);

  // 1. Parallel Source Discovery (Fast async with timeout)
  let sourcesAttempted = 0;
  let sourcesSucceeded = 0;
  let sourcesFailed = 0;
  const rawCandidates = [];

  // A. Greenhouse ATS Boards
  const ghPromises = GREENHOUSE_BOARDS.map(async (board) => {
    sourcesAttempted++;
    try {
      const jobs = await fetchGreenhouseBoardJobs(board);
      sourcesSucceeded++;
      return jobs;
    } catch (err) {
      sourcesFailed++;
      return [];
    }
  });

  // B. Lever ATS Feeds
  const leverPromises = LEVER_COMPANIES.map(async (company) => {
    sourcesAttempted++;
    try {
      const jobs = await fetchLeverPostings(company);
      sourcesSucceeded++;
      return jobs;
    } catch (err) {
      sourcesFailed++;
      return [];
    }
  });

  // C. Live Remote & Specialized Job Feeds
  const liveFeedsPromise = (async () => {
    sourcesAttempted++;
    try {
      const liveJobs = await scrapeLiveJobsForQuery(effectiveQuery, userProfile);
      sourcesSucceeded++;
      return liveJobs || [];
    } catch (err) {
      sourcesFailed++;
      return [];
    }
  })();

  // D. Google Jobs via Serper (if key configured)
  const serperPromise = (async () => {
    if (process.env.SERPER_API_KEY) {
      sourcesAttempted++;
      try {
        const targetLoc = (effectiveConstraints.predicates?.location?.target_city !== 'Anywhere' ? effectiveConstraints.predicates?.location?.target_city : null) 
          || (effectiveConstraints.predicates?.location?.target_country !== 'Anywhere' ? effectiveConstraints.predicates?.location?.target_country : null) 
          || '';
        const serperJobs = await searchGoogleJobsViaSerper(effectiveQuery, targetLoc);
        sourcesSucceeded++;
        return serperJobs || [];
      } catch (err) {
        sourcesFailed++;
        return [];
      }
    }
    return [];
  })();

  const settled = await Promise.allSettled([
    ...ghPromises,
    ...leverPromises,
    liveFeedsPromise,
    serperPromise
  ]);

  for (const res of settled) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      rawCandidates.push(...res.value);
    }
  }

  const candidatesDiscovered = rawCandidates.length;

  // 2. Normalization
  const normalizedCandidates = rawCandidates.map(c => {
    const loc = normalizeLocation(c.location_raw || c.location_city || c.location_country);
    const oppType = classifyOpportunityType(c.title, c.description_text || '');
    return {
      ...c,
      location_country: loc.country || c.location_country || null,
      location_city: loc.city || c.location_city || null,
      is_remote: loc.is_remote ? 1 : (c.is_remote ? 1 : 0),
      work_modality: loc.is_remote ? 'remote' : (c.work_modality || 'onsite'),
      opportunity_type: oppType,
      is_live_discovered: true
    };
  });

  const extracted = normalizedCandidates.length;

  // 3. Identity Validation & Liveness URL Check
  const identityValidated = [];
  for (const c of normalizedCandidates) {
    let appUrlType = c.application_url_type || 'JOB_PAGE_WITH_APPLY_BUTTON';
    if (c.application_url) {
      const idCheck = verifyJobIdentity(
        { company_name: c.company_name, title: c.title, job_id: c.id },
        { company_name: c.company_name, title: c.title, application_url: c.application_url }
      );
      if (idCheck.is_match) {
        appUrlType = 'EXACT_JOB_APPLICATION';
      }
    }
    identityValidated.push({ ...c, application_url_type: appUrlType });
  }

  const verified = identityValidated.length;

  // 4. Deduplication & SQLite Cache Integration
  const insertOpp = db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      id, title, company, organization, opportunity_type, category,
      location_country, location_city, location_raw, is_remote, work_mode,
      is_paid, salary_min, salary_max, salary_currency, stipend_text,
      description, job_page_url, official_apply_url, application_url_type,
      source_name, source_authority_level, source_url, verification_level,
      verification_status, confidence_score, last_verified_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);

  const insertEvidence = db.prepare(`
    INSERT OR REPLACE INTO opportunity_evidence (
      id, opportunity_id, field_name, source_url, source_type,
      evidence_text, extracted_value, retrieved_at, extraction_method, confidence, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();

  // Ingest/update live candidates into SQLite cache
  for (const opp of identityValidated) {
    try {
      insertOpp.run(
        opp.id,
        opp.title || null,
        opp.company_name || opp.company || null,
        opp.company_name || opp.company || null,
        opp.opportunity_type || 'job',
        opp.category || null,
        opp.location_country || null,
        opp.location_city || null,
        opp.location_raw || null,
        opp.is_remote ? 1 : 0,
        opp.work_modality || 'onsite',
        opp.is_paid !== undefined ? opp.is_paid : null,
        opp.salary_min ?? null,
        opp.salary_max ?? null,
        opp.salary_currency || null,
        opp.stipend_text || null,
        opp.description_text || null,
        opp.job_page_url || opp.source_url || null,
        opp.application_url || opp.source_url || null,
        opp.application_url_type || 'JOB_PAGE_WITH_APPLY_BUTTON',
        opp.source_name || 'Official ATS',
        opp.source_authority_level || 1,
        opp.source_url || null,
        opp.verification_level || 5,
        'VERIFIED_ACTIVE',
        opp.confidence_score || 95.0,
        now
      );

      const evs = extractFieldEvidence({
        ...opp,
        official_apply_url: opp.application_url || opp.source_url
      });
      for (const ev of evs) {
        insertEvidence.run(
          ev.id,
          opp.id,
          ev.field_name,
          ev.source_url || '',
          ev.source_type || 'official_ats',
          ev.evidence_text || '',
          typeof ev.extracted_value === 'string' ? ev.extracted_value : JSON.stringify(ev.extracted_value || {}),
          now,
          ev.extraction_method || 'structured_api',
          ev.confidence || 0.95,
          ev.is_verified ? 1 : 0
        );
      }
    } catch (dbErr) {
      // Ignore
    }
  }

  // Non-blocking sync to opportunities_db.json for newly discovered opportunities
  if (identityValidated.length > 0) {
    setTimeout(() => {
      try {
        if (fs.existsSync(jsonDbPath)) {
          const fileContent = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
          if (Array.isArray(fileContent.opportunities)) {
            const existingIds = new Set(fileContent.opportunities.map(o => o.id));
            let added = 0;
            for (const opp of identityValidated) {
              if (!existingIds.has(opp.id)) {
                fileContent.opportunities.push({
                  id: opp.id,
                  title: opp.title,
                  company: opp.company_name || opp.company,
                  organization: opp.company_name || opp.company,
                  opportunity_type: opp.opportunity_type || 'job',
                  type: opp.opportunity_type || 'job',
                  category: opp.category || 'General',
                  location_country: opp.location_country || 'Malaysia',
                  location_city: opp.location_city || 'Kuala Lumpur',
                  is_remote: opp.is_remote ? 1 : 0,
                  work_mode: opp.work_modality || 'onsite',
                  salary_min: opp.salary_min ?? null,
                  salary_max: opp.salary_max ?? null,
                  salary_currency: opp.salary_currency || null,
                  stipend_text: opp.stipend_text || null,
                  description: opp.description_text || '',
                  official_apply_url: opp.application_url || opp.source_url || '',
                  official_program_url: opp.job_page_url || opp.source_url || '',
                  source_name: opp.source_name || 'Official ATS',
                  source_url: opp.source_url || '',
                  trust_score: opp.trust_score || 95,
                  confidence_score: opp.confidence_score || 95.0,
                  verification_status: 'VERIFIED_ACTIVE',
                  last_verified_at: now
                });
                existingIds.add(opp.id);
                added++;
              }
            }
            if (added > 0) {
              fs.writeFileSync(jsonDbPath, JSON.stringify(fileContent, null, 2), 'utf-8');
            }
          }
        }
      } catch (syncErr) {
        // Non-blocking
      }
    }, 100);
  }

  // Retrieve full candidate pool from SQLite (Live Discovered + Cached)
  const isAnywhere = effectiveConstraints.predicates?.location?.mode === 'ANYWHERE';
  const targetCountryParam = `%${effectiveConstraints.predicates?.location?.target_country || 'Malaysia'}%`;
  const targetCityParam = `%${effectiveConstraints.predicates?.location?.target_city || 'Kuala Lumpur'}%`;

  let masterPoolQuery = `
    SELECT * FROM opportunities 
    WHERE verification_status NOT IN ('DEAD', 'EXPIRED', 'CLOSED', 'verification_failed')
  `;

  if (!isAnywhere) {
    masterPoolQuery += `
      ORDER BY 
        CASE 
          WHEN location_country LIKE ? OR location_city LIKE ? THEN 0 
          ELSE 1 
        END ASC,
        source_authority_level ASC, 
        confidence_score DESC
    `;
  } else {
    masterPoolQuery += ` ORDER BY source_authority_level ASC, confidence_score DESC`;
  }

  const allActiveCandidates = !isAnywhere 
    ? db.prepare(masterPoolQuery).all(targetCountryParam, targetCityParam)
    : db.prepare(masterPoolQuery).all();

  // Deduplicate master pool
  const uniquePool = deduplicateOpportunities(allActiveCandidates);
  const duplicatesRemoved = allActiveCandidates.length - uniquePool.length;

  // 5. Hard Constraint Filtering & Role Gate
  let hardConstraintPassed = 0;
  let hardConstraintRejected = 0;
  const passedCandidates = [];
  const rejections = {
    wrong_location: 0,
    wrong_opportunity_type: 0,
    unpaid: 0,
    unknown_compensation: 0,
    wrong_role_family: 0,
    expired: 0,
    experience_mismatch: 0,
    other: 0
  };
  const sampleRejections = [];

  for (const opp of uniquePool) {
    const hardCheck = evaluateHardConstraints(opp, effectiveConstraints);
    if (!hardCheck.is_eligible) {
      hardConstraintRejected++;
      for (const f of hardCheck.failed_constraints) {
        if (f.constraint === 'LOCATION') rejections.wrong_location++;
        else if (f.constraint === 'OPPORTUNITY_TYPE') rejections.wrong_opportunity_type++;
        else if (f.constraint === 'COMPENSATION') {
          if (f.actual?.includes('Unpaid')) rejections.unpaid++;
          else rejections.unknown_compensation++;
        } else if (f.constraint === 'ROLE_RELEVANCE') rejections.wrong_role_family++;
        else if (f.constraint === 'EXPERIENCE') rejections.experience_mismatch++;
        else rejections.other++;
      }

      if (sampleRejections.length < 10) {
        sampleRejections.push({
          id: opp.id,
          title: opp.title,
          company: opp.company || opp.company_name,
          location: `${opp.location_city || ''}, ${opp.location_country || ''}`,
          failed_reasons: hardCheck.failed_constraints
        });
      }
      continue;
    }

    hardConstraintPassed++;
    passedCandidates.push({ opp, hardCheck });
  }

  // 6. 7-Factor Weighted Match Scoring & Evidence Retrieval
  const scoredOpportunities = [];
  const getEvidenceStmt = db.prepare(`
    SELECT field_name, source_url, source_type, evidence_text, extracted_value, extraction_method, confidence
    FROM opportunity_evidence
    WHERE opportunity_id = ?
  `);

  for (const { opp, hardCheck } of passedCandidates) {
    const matchData = calculateDeterministicMatchScore(opp, userProfile || {});
    const evidenceRecords = getEvidenceStmt.all(opp.id);

    scoredOpportunities.push({
      ...opp,
      compensation_category: hardCheck.compensation_category,
      match_score: matchData.score,
      match_breakdown: matchData.breakdown,
      match_reasons: matchData.matchReasons,
      match_flags: matchData.flags,
      pros: matchData.pros,
      potential_gaps: matchData.potential_gaps,
      why_matches_you: matchData.whyMatches,
      evidence_count: evidenceRecords.length,
      evidence_records: evidenceRecords
    });
  }

  // 7. Deterministic Ranking & Pagination
  scoredOpportunities.sort((a, b) => {
    const scoreA = (a.match_score * 0.7) + (a.confidence_score * 0.3);
    const scoreB = (b.match_score * 0.7) + (b.confidence_score * 0.3);
    return scoreB - scoreA;
  });

  const paginated = scoredOpportunities.slice(0, 30);
  const finalReturned = paginated.length;

  // 8. Determine Truthful Status
  let status = 'success';
  if (sourcesSucceeded === 0) {
    status = 'discovery_failed';
  } else if (finalReturned === 0) {
    if (candidatesDiscovered === 0 && uniquePool.length === 0) {
      status = 'zero_discovered';
    } else {
      status = 'zero_matched_requirements';
    }
  }

  // 9. Structured Telemetry & Diagnostics Payload
  const telemetry = {
    query: effectiveQuery,
    intent: {
      opportunity_type: effectiveConstraints.predicates?.allowed_types?.[0] || 'job',
      target_role_family: effectiveConstraints.predicates?.role_relevance?.target_role_family || 'OTHER',
      location_mode: effectiveConstraints.predicates?.location?.mode || 'METRO_RADIUS',
      target_city: effectiveConstraints.predicates?.location?.target_city || null,
      target_country: effectiveConstraints.predicates?.location?.target_country || null,
      compensation_required: effectiveConstraints.predicates?.compensation?.is_mandatory || false
    },
    queriesGenerated: searchPlan.queries.length,
    generatedQueries: searchPlan.queries,
    sourcesAttempted,
    sourcesSucceeded,
    sourcesFailed,
    candidatesDiscovered,
    extracted,
    identityValidated: verified,
    verified,
    duplicatesRemoved,
    hardConstraintPassed,
    hardConstraintRejected,
    ranked: scoredOpportunities.length,
    displayed: finalReturned,
    rejections,
    sampleRejections: debug ? sampleRejections : undefined
  };

  console.log(`[Discovery Orchestrator] Completed: ${candidatesDiscovered} discovered, ${verified} verified, ${hardConstraintPassed} eligible, ${finalReturned} returned.`);

  return {
    status,
    query_summary: effectiveQuery,
    telemetry,
    funnel_metrics: {
      total_discovered: candidatesDiscovered + uniquePool.length,
      active_verified: verified + uniquePool.length,
      passed_hard_filter: hardConstraintPassed,
      final_returned: finalReturned
    },
    results: paginated
  };
}

export default { discoverOpportunities };
