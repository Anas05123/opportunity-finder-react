/**
 * Multi-Stage Deduplication Engine (V3)
 * Stage 1: URL query stripping (strip tracking params).
 * Stage 2: Canonical application URL hash matching.
 * Stage 3: Normalized composite key (company + title + country).
 * Stage 4: Jaro-Winkler entity similarity.
 */

// Helper to strip tracking tokens
export function canonicalizeUrl(urlStr = '') {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    const paramsToDelete = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'refId', 'trackingId', 'gh_jid', 'sessionId', 'fbclid'];
    paramsToDelete.forEach(p => parsed.searchParams.delete(p));
    parsed.hash = ''; // Remove hash
    return parsed.toString().toLowerCase().replace(/\/$/, '');
  } catch (e) {
    return urlStr.toLowerCase().trim().replace(/\/$/, '');
  }
}

// Simple Jaro-Winkler similarity calculation
export function calculateJaroWinkler(s1 = '', s2 = '') {
  const a = s1.toLowerCase().replace(/[^\w]/g, '');
  const b = s2.toLowerCase().replace(/[^\w]/g, '');
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const sim = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  return sim;
}

export function deduplicateOpportunities(opportunities = []) {
  const uniqueList = [];
  const seenCanonicalUrls = new Set();
  const seenCompositeKeys = new Set();

  for (const opp of opportunities) {
    const canonUrl = canonicalizeUrl(opp.application_url || opp.source_url);
    if (canonUrl && seenCanonicalUrls.has(canonUrl)) {
      continue; // Duplicate exact URL
    }

    const compKey = `${(opp.company_name || opp.company || '').toLowerCase().replace(/[^\w]/g, '')}_${(opp.title || '').toLowerCase().replace(/[^\w]/g, '')}_${(opp.location_country || 'my').toLowerCase()}`;
    if (seenCompositeKeys.has(compKey)) {
      continue; // Duplicate entity
    }

    // Fuzzy check against already accepted uniqueList
    let isFuzzyDuplicate = false;
    for (const existing of uniqueList) {
      const sameCompany = calculateJaroWinkler(opp.company_name, existing.company_name) > 0.90;
      if (sameCompany) {
        const titleSim = calculateJaroWinkler(opp.title, existing.title);
        if (titleSim > 0.85) {
          isFuzzyDuplicate = true;
          // Prefer Level 1 ATS over Level 4 search index
          if ((opp.source_authority_level || 5) < (existing.source_authority_level || 5)) {
            // Upgrade existing record with higher authority link
            existing.application_url = opp.application_url;
            existing.source_authority_level = opp.source_authority_level;
            existing.source_name = opp.source_name;
          }
          break;
        }
      }
    }

    if (!isFuzzyDuplicate) {
      if (canonUrl) seenCanonicalUrls.add(canonUrl);
      seenCompositeKeys.add(compKey);
      uniqueList.push(opp);
    }
  }

  return uniqueList;
}

export const processAndDeduplicate = (rawItems = []) => {
  const deduped = deduplicateOpportunities(rawItems);
  return {
    unique: deduped,
    duplicatesCount: Math.max(0, rawItems.length - deduped.length)
  };
};

export default { canonicalizeUrl, calculateJaroWinkler, deduplicateOpportunities, processAndDeduplicate };
