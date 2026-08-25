import db from '../../db/sqliteClient.js';
import { canonicalizeUrl, calculateJaroWinkler } from '../deduplicator.js';

/**
 * Deterministic Database Deduplication & Merging Engine
 */
export function deduplicateAndMergeOpportunity(newOpp) {
  const sourceId = newOpp.source_id;
  const externalId = newOpp.external_id;
  const applyUrl = canonicalizeUrl(newOpp.official_apply_url || newOpp.source_url);
  const normCompany = newOpp.normalized_company || '';
  const normTitle = newOpp.normalized_title || '';
  const normLocation = (newOpp.location_country || '').toLowerCase();

  // 1. Stage 1: Exact Source + External ID Match
  if (sourceId && externalId) {
    const existingByExternal = db.prepare(`
      SELECT id, source_authority_level, verification_level, last_seen_at
      FROM opportunities
      WHERE source_id = ? AND external_id = ?
    `).get(sourceId, externalId);

    if (existingByExternal) {
      // Update temporal heartbeat and provenance
      db.prepare(`
        UPDATE opportunities
        SET last_seen_at = CURRENT_TIMESTAMP,
            last_verified_at = CURRENT_TIMESTAMP,
            status = 'active',
            lifecycle_status = 'ACTIVE',
            scrape_run_id = COALESCE(?, scrape_run_id)
        WHERE id = ?
      `).run(newOpp.scrape_run_id || null, existingByExternal.id);

      return { isDuplicate: true, matchType: 'EXTERNAL_ID', canonicalId: existingByExternal.id };
    }
  }

  // 2. Stage 2: Canonical Application URL Match
  if (applyUrl && applyUrl !== '#') {
    const existingByUrl = db.prepare(`
      SELECT id, source_authority_level, verification_level
      FROM opportunities
      WHERE official_apply_url = ? OR job_page_url = ?
    `).get(newOpp.official_apply_url, newOpp.official_apply_url);

    if (existingByUrl) {
      // If new source has higher authority, upgrade
      if ((newOpp.source_authority_level || 5) < (existingByUrl.source_authority_level || 5)) {
        db.prepare(`
          UPDATE opportunities
          SET source_name = ?,
              source_tier = ?,
              source_authority_level = ?,
              trust_score = ?,
              verification_level = ?,
              scrape_run_id = COALESCE(?, scrape_run_id),
              last_seen_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          newOpp.source_name,
          newOpp.source_tier,
          newOpp.source_authority_level,
          newOpp.trust_score,
          newOpp.verification_level,
          newOpp.scrape_run_id || null,
          existingByUrl.id
        );
      } else {
        db.prepare(`
          UPDATE opportunities 
          SET last_seen_at = CURRENT_TIMESTAMP,
              last_verified_at = CURRENT_TIMESTAMP,
              status = 'active',
              lifecycle_status = 'ACTIVE',
              source_id = COALESCE(opportunities.source_id, ?),
              external_id = COALESCE(opportunities.external_id, ?),
              scrape_run_id = COALESCE(?, scrape_run_id)
          WHERE id = ?
        `).run(newOpp.source_id || null, newOpp.external_id || null, newOpp.scrape_run_id || null, existingByUrl.id);
      }

      return { isDuplicate: true, matchType: 'CANONICAL_URL', canonicalId: existingByUrl.id };
    }
  }

  // 3. Stage 3: Normalized Composite Key Match (Excludes generic fallback tokens)
  if (normCompany && normTitle && normCompany.length > 2 && normTitle.length > 3 && normCompany !== 'Enterprise' && normTitle !== 'Opportunity') {
    const existingByComposite = db.prepare(`
      SELECT id, source_authority_level, location_country
      FROM opportunities
      WHERE normalized_company = ? AND normalized_title = ?
    `).get(normCompany, normTitle);

    if (existingByComposite) {
      const sameCountry = !normLocation || !existingByComposite.location_country || existingByComposite.location_country.toLowerCase().includes(normLocation) || normLocation.includes(existingByComposite.location_country.toLowerCase());
      if (sameCountry) {
        db.prepare(`
          UPDATE opportunities 
          SET last_seen_at = CURRENT_TIMESTAMP,
              last_verified_at = CURRENT_TIMESTAMP,
              status = 'active',
              lifecycle_status = 'ACTIVE',
              source_id = COALESCE(opportunities.source_id, ?),
              external_id = COALESCE(opportunities.external_id, ?),
              scrape_run_id = COALESCE(?, scrape_run_id)
          WHERE id = ?
        `).run(newOpp.source_id || null, newOpp.external_id || null, newOpp.scrape_run_id || null, existingByComposite.id);
        return { isDuplicate: true, matchType: 'COMPOSITE_FINGERPRINT', canonicalId: existingByComposite.id };
      }
    }
  }

  return { isDuplicate: false };
}

export default { deduplicateAndMergeOpportunity };
