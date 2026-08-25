/**
 * Deterministic Global Location Normalizer & Country Code (gl) Resolver
 * Accurately detects and normalizes cities/countries worldwide without false defaults.
 */

// Global Country & Metro Registry with ISO country codes (gl)
const GLOBAL_LOCATIONS = [
  // Netherlands
  { names: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'utrecht', 'eindhoven', 'the hague', 'den haag', 'groningen', 'delft'], country: 'Netherlands', gl: 'nl' },
  // United Kingdom
  { names: ['united kingdom', 'uk', 'great britain', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham', 'edinburgh', 'bristol', 'cambridge', 'oxford', 'glasgow', 'leeds'], country: 'United Kingdom', gl: 'uk' },
  // United States
  { names: ['united states', 'usa', 'us', 'u.s.', 'america', 'new york', 'nyc', 'san francisco', 'los angeles', 'chicago', 'austin', 'seattle', 'boston', 'california', 'texas', 'florida', 'silicon valley'], country: 'United States', gl: 'us' },
  // Germany
  { names: ['germany', 'deutschland', 'berlin', 'munich', 'münchen', 'frankfurt', 'hamburg', 'cologne', 'köln', 'stuttgart', 'bonn', 'düsseldorf'], country: 'Germany', gl: 'de' },
  // France
  { names: ['france', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'nice', 'nantes'], country: 'France', gl: 'fr' },
  // Canada
  { names: ['canada', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton', 'quebec'], country: 'Canada', gl: 'ca' },
  // Australia
  { names: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra'], country: 'Australia', gl: 'au' },
  // Singapore
  { names: ['singapore', 'sg'], country: 'Singapore', gl: 'sg' },
  // United Arab Emirates
  { names: ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'sharjah'], country: 'United Arab Emirates', gl: 'ae' },
  // Saudi Arabia
  { names: ['saudi arabia', 'ksa', 'riyadh', 'jeddah', 'dammam'], country: 'Saudi Arabia', gl: 'sa' },
  // Qatar
  { names: ['qatar', 'doha'], country: 'Qatar', gl: 'qa' },
  // Switzerland
  { names: ['switzerland', 'schweiz', 'suisse', 'zurich', 'zürich', 'geneva', 'genève', 'basel', 'lausanne', 'bern'], country: 'Switzerland', gl: 'ch' },
  // Sweden
  { names: ['sweden', 'sverige', 'stockholm', 'gothenburg', 'göteborg', 'malmö'], country: 'Sweden', gl: 'se' },
  // Norway
  { names: ['norway', 'norge', 'oslo', 'bergen', 'trondheim'], country: 'Norway', gl: 'no' },
  // Denmark
  { names: ['denmark', 'danmark', 'copenhagen', 'københavn', 'aarhus'], country: 'Denmark', gl: 'dk' },
  // Ireland
  { names: ['ireland', 'dublin', 'cork', 'galway', 'limerick'], country: 'Ireland', gl: 'ie' },
  // Spain
  { names: ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'seville', 'sevilla', 'bilbao'], country: 'Spain', gl: 'es' },
  // Italy
  { names: ['italy', 'italia', 'rome', 'roma', 'milan', 'milano', 'turin', 'torino', 'bologna'], country: 'Italy', gl: 'it' },
  // Japan
  { names: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'fukuoka'], country: 'Japan', gl: 'jp' },
  // South Korea
  { names: ['south korea', 'korea', 'seoul', 'busan', 'incheon'], country: 'South Korea', gl: 'kr' },
  // China / Hong Kong
  { names: ['china', 'beijing', 'shanghai', 'shenzhen', 'guangzhou', 'hangzhou'], country: 'China', gl: 'cn' },
  { names: ['hong kong', 'hk'], country: 'Hong Kong', gl: 'hk' },
  // India
  { names: ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi', 'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon'], country: 'India', gl: 'in' },
  // Indonesia
  { names: ['indonesia', 'jakarta', 'bali', 'surabaya', 'bandung'], country: 'Indonesia', gl: 'id' },
  // Thailand
  { names: ['thailand', 'bangkok', 'phuket', 'chiang mai'], country: 'Thailand', gl: 'th' },
  // Vietnam
  { names: ['vietnam', 'ho chi minh', 'hanoi', 'da nang'], country: 'Vietnam', gl: 'vn' },
  // Philippines
  { names: ['philippines', 'manila', 'cebu', 'makati', 'taguig', 'quezon city'], country: 'Philippines', gl: 'ph' },
  // Malaysia (Only matched when explicitly requested!)
  { names: ['malaysia', 'kuala lumpur', 'kl', 'klcc', 'kuala lumpur city centre', 'bukit bintang', 'bangsar', 'mont kiara', 'damansara', 'selangor', 'petaling jaya', 'pj', 'cyberjaya', 'shah alam', 'subang jaya', 'subang', 'penang', 'george town', 'johor', 'johor bahru', 'jb', 'melaka', 'malacca', 'putrajaya'], country: 'Malaysia', gl: 'my' },
  // Turkey
  { names: ['turkey', 'türkiye', 'istanbul', 'ankara', 'izmir'], country: 'Turkey', gl: 'tr' },
  // Egypt
  { names: ['egypt', 'cairo', 'alexandria', 'giza'], country: 'Egypt', gl: 'eg' },
  // Brazil
  { names: ['brazil', 'brasil', 'são paulo', 'sao paulo', 'rio de janeiro'], country: 'Brazil', gl: 'br' },
  // Poland
  { names: ['poland', 'polska', 'warsaw', 'warszawa', 'krakow', 'kraków', 'wrocław'], country: 'Poland', gl: 'pl' },
  // Austria
  { names: ['austria', 'österreich', 'vienna', 'wien', 'salzburg', 'graz'], country: 'Austria', gl: 'at' },
  // Belgium
  { names: ['belgium', 'belgique', 'brussels', 'bruxelles', 'antwerp', 'ghent'], country: 'Belgium', gl: 'be' },
  // New Zealand
  { names: ['new zealand', 'auckland', 'wellington', 'christchurch'], country: 'New Zealand', gl: 'nz' }
];

const CITY_CANONICAL_MAP = {
  'kl': 'Kuala Lumpur',
  'klcc': 'Kuala Lumpur',
  'kuala lumpur': 'Kuala Lumpur',
  'kuala lumpur city centre': 'Kuala Lumpur',
  'bukit bintang': 'Kuala Lumpur',
  'bangsar': 'Kuala Lumpur',
  'pj': 'Petaling Jaya',
  'petaling jaya': 'Petaling Jaya',
  'jb': 'Johor Bahru',
  'johor bahru': 'Johor Bahru',
  'nyc': 'New York',
  'new york': 'New York',
  'sf': 'San Francisco',
  'san francisco': 'San Francisco',
  'silicon valley': 'San Francisco',
  'hk': 'Hong Kong',
  'hong kong': 'Hong Kong',
  'sg': 'Singapore',
  'singapore': 'Singapore'
};

/**
 * Detect location and proper country code (gl) from query or location string.
 * Never defaults to Malaysia unless specifically requested.
 */
export function detectLocationAndCountryCode(queryOrLocation = '') {
  if (!queryOrLocation || typeof queryOrLocation !== 'string') {
    return { country: 'Worldwide', city: null, gl: 'us', is_remote: false, isExplicit: false };
  }

  const s = queryOrLocation.toLowerCase().trim();

  // Check for remote / worldwide
  if (
    s.includes('remote') ||
    s.includes('worldwide') ||
    s.includes('anywhere') ||
    s.includes('global') ||
    s.includes('wfh') ||
    s.includes('work from home')
  ) {
    return { country: 'Worldwide', city: null, gl: 'us', is_remote: true, isExplicit: true };
  }

  // First pass: look for city/metro matches (prioritize specific city matches over generic country names)
  let foundCountryMatch = null;

  for (const loc of GLOBAL_LOCATIONS) {
    for (const name of loc.names) {
      const isCountryName = name.toLowerCase() === loc.country.toLowerCase();
      const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(s)) {
        if (!isCountryName) {
          // Specific city/metro match found!
          const canonicalCity = CITY_CANONICAL_MAP[name.toLowerCase()] || 
            name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return {
            country: loc.country,
            city: canonicalCity,
            gl: loc.gl,
            is_remote: false,
            isExplicit: true
          };
        } else if (!foundCountryMatch) {
          foundCountryMatch = {
            country: loc.country,
            city: null,
            gl: loc.gl,
            is_remote: false,
            isExplicit: true
          };
        }
      }
    }
  }

  if (foundCountryMatch) {
    return foundCountryMatch;
  }

  // Generic fallback if not recognized: default to Global / Worldwide (gl: 'us')
  return {
    country: 'Worldwide',
    city: null,
    gl: 'us',
    is_remote: false,
    isExplicit: false
  };
}

/**
 * Deterministic Location Normalizer
 */
export function normalizeLocation(raw = '') {
  if (!raw || typeof raw !== 'string') {
    return { city: null, country: 'Worldwide', is_remote: false, raw: null };
  }

  const s = raw.trim();
  const detected = detectLocationAndCountryCode(s);

  if (detected.isExplicit) {
    return {
      city: detected.city,
      country: detected.country,
      is_remote: detected.is_remote,
      raw: s
    };
  }

  // If comma separated like "City, Country"
  if (s.includes(',')) {
    const parts = s.split(',').map(p => p.trim());
    if (parts[0].length < 40 && parts[parts.length - 1].length < 40) {
      return { city: parts[0], country: parts[parts.length - 1], is_remote: false, raw: s };
    }
  }

  // Only assign city if short string and does not look like a sentence
  if (s.length < 35 && !s.includes('.') && !s.includes('\n')) {
    return { city: s, country: 'Worldwide', is_remote: false, raw: s };
  }

  return { city: null, country: 'Worldwide', is_remote: false, raw: s };
}

export default { normalizeLocation, detectLocationAndCountryCode };
