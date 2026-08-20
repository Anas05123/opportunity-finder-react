/**
 * Deterministic Location Normalizer (V3/V4)
 * Normalizes raw location strings into structured City and Country.
 */

export function normalizeLocation(raw = '') {
  if (!raw || typeof raw !== 'string') {
    return { city: null, country: null, is_remote: false, raw: null };
  }

  const s = raw.trim();
  const lower = s.toLowerCase();

  // Remote checks
  if (lower === 'remote' || lower === 'worldwide' || lower === 'anywhere' || lower === 'global / worldwide' || lower === 'remote / worldwide') {
    return { city: null, country: 'Remote / Worldwide', is_remote: true, raw: s };
  }

  // Kuala Lumpur variations
  if (
    lower === 'kuala lumpur' ||
    lower === 'kuala lumpur, malaysia' ||
    lower === 'kl' ||
    lower === 'kl, malaysia' ||
    lower === 'kuala lumpur city centre' ||
    lower === 'klcc' ||
    lower.includes('bukit bintang, kuala lumpur') ||
    lower.includes('bangsar, kuala lumpur') ||
    lower.includes('mid valley, kuala lumpur') ||
    lower.includes('kl sentral')
  ) {
    return { city: 'Kuala Lumpur', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Petaling Jaya
  if (lower.includes('petaling jaya') || lower === 'pj' || lower === 'pj, selangor') {
    return { city: 'Petaling Jaya', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Cyberjaya
  if (lower.includes('cyberjaya')) {
    return { city: 'Cyberjaya', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Shah Alam
  if (lower.includes('shah alam')) {
    return { city: 'Shah Alam', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Subang Jaya
  if (lower.includes('subang jaya') || lower === 'subang') {
    return { city: 'Subang Jaya', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Penang / George Town
  if (lower.includes('penang') || lower.includes('george town')) {
    return { city: 'Penang', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Selangor generic
  if (lower === 'selangor' || lower === 'selangor, malaysia') {
    return { city: 'Selangor', country: 'Malaysia', is_remote: false, raw: s };
  }

  // Malaysia generic (city unknown)
  if (lower === 'malaysia') {
    return { city: null, country: 'Malaysia', is_remote: false, raw: s };
  }

  // Non-location workplace labels
  if (lower === 'in-office' || lower === 'hybrid' || lower === 'onsite') {
    return { city: null, country: null, is_remote: false, raw: s };
  }

  // Generic comma-separated fallback (e.g. "San Francisco, CA" or "London, UK")
  if (s.includes(',')) {
    const parts = s.split(',').map(p => p.trim());
    return { city: parts[0], country: parts[parts.length - 1], is_remote: false, raw: s };
  }

  return { city: s, country: null, is_remote: false, raw: s };
}

export default { normalizeLocation };
