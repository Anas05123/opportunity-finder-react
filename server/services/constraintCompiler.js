/**
 * Deterministic Constraint Compiler (V4)
 * Compiles user intent into a typed, machine-executable AST.
 * Explicitly handles ANYWHERE modes, structured role families, and opportunity types.
 */

export function compileSearchConstraints(rawQuery = '', userProfile = {}) {
  const q = (rawQuery || '').toLowerCase().trim();
  
  // 1. Detect Geographic Scope
  const mentionsKL = q.includes('kuala lumpur') || q.includes('kl');
  const mentionsSelangor = q.includes('selangor') || q.includes('petaling jaya') || q.includes('pj') || q.includes('subang');
  const mentionsMalaysia = q.includes('malaysia') || mentionsKL || mentionsSelangor || q.includes('penang') || q.includes('johor') || q.includes('cyberjaya') || q.includes('shah alam');
  const mentionsUS = q.includes('united states') || q.includes('usa') || q.includes('us only') || q.includes('in us');
  const mentionsGermany = q.includes('germany') || q.includes('berlin') || q.includes('munich');
  const mentionsSingapore = q.includes('singapore');
  const mentionsAntarctica = q.includes('antartica') || q.includes('antarctica');
  const isStrictCity = q.includes('only') || q.includes('strictly') || q.includes('within kl');
  const isExplicitAnywhere = q.includes('anywhere') || q.includes('global') || q.includes('worldwide') || q.includes('any location') || q.includes('all regions');

  let locationMode = 'ANYWHERE';
  let targetCountry = 'Anywhere';
  let targetCity = 'Anywhere';
  let allowedCities = [];
  let prohibitedCities = [];
  let allowsRemote = true;

  if (isExplicitAnywhere) {
    locationMode = 'ANYWHERE';
  } else if (mentionsMalaysia) {
    locationMode = 'METRO_RADIUS';
    targetCountry = 'Malaysia';
    targetCity = mentionsKL ? 'Kuala Lumpur' : (mentionsSelangor ? 'Selangor' : 'Malaysia');
    allowedCities = ['Kuala Lumpur', 'KL', 'Selangor', 'Petaling Jaya', 'Subang Jaya', 'Cyberjaya'];
    allowsRemote = q.includes('remote') || q.includes('wfh');

    if (isStrictCity && mentionsKL) {
      locationMode = 'STRICT_CITY_ONLY';
      targetCity = 'Kuala Lumpur';
      allowedCities = ['Kuala Lumpur', 'KL'];
      prohibitedCities = ['Petaling Jaya', 'Cyberjaya', 'Shah Alam', 'Subang Jaya', 'Penang', 'Johor', 'Selangor', 'Klang Valley'];
    }
  } else if (mentionsUS) {
    locationMode = 'METRO_RADIUS';
    targetCountry = 'United States';
    targetCity = 'United States';
    allowedCities = ['United States', 'USA', 'San Francisco', 'New York', 'Seattle', 'Austin', 'Remote'];
  } else if (mentionsGermany) {
    locationMode = 'METRO_RADIUS';
    targetCountry = 'Germany';
    targetCity = 'Germany';
    allowedCities = ['Germany', 'Berlin', 'Munich', 'Bonn', 'Frankfurt'];
  } else if (mentionsSingapore) {
    locationMode = 'METRO_RADIUS';
    targetCountry = 'Singapore';
    targetCity = 'Singapore';
    allowedCities = ['Singapore'];
  } else if (mentionsAntarctica) {
    locationMode = 'STRICT_CITY_ONLY';
    targetCountry = 'Antarctica';
    targetCity = 'Antarctica';
    allowedCities = ['Antarctica'];
    prohibitedCities = ['Malaysia', 'United States', 'Germany', 'Singapore', 'UK', 'Remote'];
  }

  // 2. Detect Opportunity Types
  const isScholarship = q.includes('scholarship') || q.includes('grant') || q.includes('fellowship') || q.includes('bursary');
  const isInternship = q.includes('intern') || q.includes('internship') || q.includes('trainee') || q.includes('traineeship') || q.includes('industrial training');
  const isJob = q.includes('job') || q.includes('full-time') || q.includes('employment') || q.includes('specialist') || q.includes('executive') || q.includes('associate') || q.includes('manager') || (!isInternship && !isScholarship);

  const allowedTypes = [];
  if (isInternship) allowedTypes.push('internship');
  if (isJob) allowedTypes.push('job');
  if (isScholarship) allowedTypes.push('scholarship', 'fellowship', 'grant');

  // 3. Compensation Constraint
  const requiresPaid = q.includes('paid') || q.includes('salary') || q.includes('stipend') || q.includes('allowance');

  // 4. Structured Role Family Classification
  let targetRoleFamily = null;
  const roleKeywords = [];

  if (q.match(/\b(software|developer|engineer|coding|frontend|backend|full stack|devops|programmer|web dev|mobile dev)\b/i)) {
    targetRoleFamily = 'SOFTWARE_ENGINEERING';
    roleKeywords.push('software', 'engineer', 'developer', 'frontend', 'backend', 'full stack', 'programmer', 'coding', 'web developer');
  } else if (q.match(/\b(digital marketing|performance marketing|social media marketing|growth marketing|seo|sem|content marketing|digital marketing intern|digital marketing specialist|marketing specialist|marketing)\b/i) && !q.includes('advertising')) {
    targetRoleFamily = 'DIGITAL_MARKETING';
    roleKeywords.push('marketing', 'digital', 'performance', 'social media', 'growth', 'content', 'seo', 'sem', 'specialist');
  } else if (q.match(/\b(advertising|creative|copywriting|copywriter|art direction|art director|account planner|brand strategist)\b/i)) {
    targetRoleFamily = 'ADVERTISING_CREATIVE';
    roleKeywords.push('advertising', 'creative', 'copywriting', 'art direction', 'account planning', 'brand strategist', 'media planner');
  } else if (q.match(/\b(finance|banking|investment|accounting|audit|treasury|financial analyst)\b/i)) {
    targetRoleFamily = 'FINANCE_ACCOUNTING';
    roleKeywords.push('finance', 'banking', 'investment', 'analyst', 'accounting', 'audit', 'treasury', 'markets');
  } else if (q.match(/\b(data science|machine learning|artificial intelligence)\b/i) || q.match(/\bdata\b/i)) {
    targetRoleFamily = 'DATA_ANALYTICS';
    roleKeywords.push('data', 'analyst', 'analytics', 'data science', 'machine learning');
  } else {
    // Specific custom keywords extracted from non-standard query (e.g. "astronaut", "quantum")
    const words = q.split(/\s+/).filter(w => !['i', 'want', 'a', 'an', 'find', 'me', 'in', 'at', 'job', 'internship', 'opportunity', 'for', 'the', 'is'].includes(w));
    if (words.length > 0) {
      roleKeywords.push(...words);
    }
  }

  const isSpecificRoleQuery = targetRoleFamily !== null || roleKeywords.length > 0;

  return {
    id: `cst-${Math.random().toString(36).substr(2, 9)}`,
    raw_query: rawQuery,
    predicates: {
      allowed_types: allowedTypes,
      location: {
        mode: locationMode,
        target_country: targetCountry,
        target_city: targetCity,
        allowed_cities: allowedCities,
        prohibited_cities: prohibitedCities,
        allow_remote: allowsRemote
      },
      compensation: {
        is_mandatory: requiresPaid,
        min_monthly_myr: 1000,
        allow_unknown: false
      },
      role_relevance: {
        is_mandatory: isSpecificRoleQuery,
        target_role_family: targetRoleFamily,
        required_keywords: roleKeywords,
        minimum_threshold: 0.25
      },
      eligibility: {
        max_experience_years: isInternship ? 0 : 5,
        allow_strict_student_only: isInternship
      }
    }
  };
}

export default { compileSearchConstraints };
