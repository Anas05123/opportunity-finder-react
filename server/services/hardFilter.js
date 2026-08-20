import { matchRoleFamilyIntent, classifyRoleFamily } from './roleFamilyClassifier.js';
import { normalizeLocation } from './locationNormalizer.js';
import { classifyOpportunityType } from './typeClassifier.js';

/**
 * Binary Hard-Filter Engine (V3/V4 Remediated)
 * Enforces strict, non-negotiable constraints deterministically.
 * Critical Rules:
 * 1. Missing or NULL fields CANNOT bypass mandatory constraints.
 * 2. Structured Role Family Classifier strictly separates SWE, Marketing, Finance, and Executive roles.
 * 3. Three-Tier Compensation Taxonomy: PAID_VERIFIED vs UNKNOWN_COMPENSATION vs UNPAID_VERIFIED.
 * 4. Strict Location Boundaries reject ambiguous composites (e.g. KL / PJ).
 */

export function classifyCompensation(opp = {}) {
  const stipendText = (opp.stipend_text || '').toLowerCase().trim();
  const hasNumericSalary = (typeof opp.salary_min === 'number' && opp.salary_min > 0) || (typeof opp.salary_max === 'number' && opp.salary_max > 0);
  
  // 1. Unpaid explicit checks (Highest precedence)
  if (opp.is_paid === 0 || opp.is_paid === false || opp.funding_level === 'unpaid') {
    return 'UNPAID_VERIFIED';
  }
  if (stipendText.match(/\b(unpaid|voluntary|volunteer|no monetary|non-paid|without pay)\b/i)) {
    return 'UNPAID_VERIFIED';
  }

  // 2. Vague / Ambiguous / Generic claims (Check BEFORE generic paid keyword matches)
  if (stipendText.match(/\b(competitive\s+salary|attractive\s+compensation|attractive\s+salary|benefits\s+available|market\s+rate|compensation\s+not\s+disclosed)\b/i) && !hasNumericSalary && opp.is_paid !== 1) {
    return 'UNKNOWN_COMPENSATION';
  }

  // 3. Paid verified checks (Explicit numeric salary or currency or paid keywords)
  if (hasNumericSalary || opp.is_paid === 1 || opp.funding_level === 'paid_salary' || opp.funding_level === 'fully_funded') {
    return 'PAID_VERIFIED';
  }
  if (stipendText.match(/\b(rm|myr|\$|usd|eur|gbp|sgd|€|£)\s*[\d,]+/i) || 
      stipendText.match(/[\d,]+\s*(myr|usd|rm|sgd|per month|\/mo|\/month|\/hr|hourly)/i) ||
      stipendText.match(/\b(paid\s+internship|paid\s+allowance|monthly\s+allowance|monthly\s+stipend|stipend\s+provided|fully\s+funded|funded)\b/i) ||
      (stipendText.match(/\b(stipend|allowance)\b/i) && stipendText.match(/\d+/))) {
    return 'PAID_VERIFIED';
  }

  return 'UNKNOWN_COMPENSATION';
}

export function evaluateRoleRelevance(opp = {}, compiledConstraints = {}) {
  const rolePred = compiledConstraints.predicates?.role_relevance;
  if (!rolePred || !rolePred.is_mandatory) {
    return { is_match: true, score: 1.0 };
  }

  const title = (opp.title || '').trim();
  const targetFamily = rolePred.target_role_family;

  // Use structured Role Family Classifier if target family is identified
  if (targetFamily) {
    const familyCheck = matchRoleFamilyIntent(title, targetFamily);
    if (!familyCheck.is_match) {
      return {
        is_match: false,
        score: 0.0,
        reason: familyCheck.reason || `Title "${title}" does not belong to ${targetFamily}`
      };
    }
    return {
      is_match: true,
      score: familyCheck.tier === 'PRIMARY' ? 1.0 : 0.6,
      family: familyCheck.family,
      tier: familyCheck.tier
    };
  }

  // Fallback keyword overlap check
  const reqKeywords = rolePred.required_keywords?.map(k => k.toLowerCase().trim()) || [];
  const titleLower = title.toLowerCase();
  let titleMatches = 0;
  for (const kw of reqKeywords) {
    if (titleLower.includes(kw)) {
      titleMatches++;
    }
  }

  if (titleMatches > 0) {
    return { is_match: true, score: 0.8 + (titleMatches * 0.1) };
  }

  return {
    is_match: false,
    score: 0.0,
    reason: `Title "${title}" does not match target role specifications`
  };
}

export function evaluateHardConstraints(opp = {}, compiledConstraints = {}) {
  const predicates = compiledConstraints.predicates;
  if (!predicates) return { is_eligible: true, failed_constraints: [], compensation_category: 'PAID_VERIFIED' };

  const failed = [];

  // 1. Opportunity Type Constraint
  if (predicates.allowed_types && predicates.allowed_types.length > 0) {
    const oppType = (opp.opportunity_type || opp.type || classifyOpportunityType(opp.title, opp.description_text || '')).toLowerCase().trim();
    if (!oppType) {
      failed.push({
        constraint: 'OPPORTUNITY_TYPE',
        expected: predicates.allowed_types.join(' or '),
        actual: 'Unknown / Unspecified Opportunity Type'
      });
    } else {
      const typeMatched = predicates.allowed_types.some(t => {
        if (t === 'internship') return oppType.includes('intern') || oppType.includes('trainee') || oppType.includes('fellowship');
        if (t === 'job') return oppType.includes('job') || oppType.includes('full-time') || oppType.includes('trainee');
        if (t === 'scholarship') return oppType.includes('scholarship') || oppType.includes('grant') || oppType.includes('fellowship');
        return oppType.includes(t);
      });

      if (!typeMatched) {
        failed.push({
          constraint: 'OPPORTUNITY_TYPE',
          expected: predicates.allowed_types.join(' or '),
          actual: oppType
        });
      }
    }
  }

  // 2. Geographic Boundary Constraint
  const loc = predicates.location;
  if (loc && loc.mode !== 'ANYWHERE') {
    const oppCountry = (opp.location_country || '').toLowerCase().trim();
    const oppCity = (opp.location_city || '').toLowerCase().trim();
    const oppRaw = (opp.location_raw || '').toLowerCase().trim();
    const isRemote = opp.is_remote === 1 || opp.is_remote === true || opp.work_modality === 'remote';

    if (loc.mode === 'STRICT_CITY_ONLY') {
      const cityTarget = (loc.target_city || '').toLowerCase();
      if (isRemote && !loc.allow_remote && !oppCity.includes(cityTarget) && !oppRaw.includes(cityTarget)) {
        failed.push({
          constraint: 'LOCATION',
          expected: `Strictly ${loc.target_city} only`,
          actual: 'Remote (Not requested by strict city constraint)'
        });
      } else if (!oppCity && !oppRaw) {
        failed.push({
          constraint: 'LOCATION',
          expected: `Strictly ${loc.target_city} only`,
          actual: 'Unspecified Location'
        });
      } else {
        const isProhibited = loc.prohibited_cities && loc.prohibited_cities.some(p => oppCity.includes(p.toLowerCase()) || oppRaw.includes(p.toLowerCase()));
        const isAllowed = loc.allowed_cities && loc.allowed_cities.some(a => oppCity.includes(a.toLowerCase()) || oppRaw.includes(a.toLowerCase()));

        if (isProhibited || !isAllowed) {
          failed.push({
            constraint: 'LOCATION',
            expected: `Strictly ${loc.target_city} only`,
            actual: opp.location_raw || opp.location_city || opp.location_country || 'Outside target city'
          });
        }
      }
    } else {
      if (!oppCountry && !oppCity && !oppRaw && !isRemote) {
        failed.push({
          constraint: 'LOCATION',
          expected: loc.target_city || loc.target_country || 'Target Location Required',
          actual: 'Unspecified Location'
        });
      } else {
        const isTargetCountry = loc.target_country ? (oppCountry.includes(loc.target_country.toLowerCase()) || oppRaw.includes(loc.target_country.toLowerCase())) : true;
        const isTargetCity = loc.target_city ? (oppCity.includes(loc.target_city.toLowerCase()) || oppRaw.includes(loc.target_city.toLowerCase())) : true;
        const isAllowedCity = loc.allowed_cities ? loc.allowed_cities.some(a => oppCity.includes(a.toLowerCase()) || oppCountry.includes(a.toLowerCase()) || oppRaw.includes(a.toLowerCase())) : true;

        if (!isTargetCountry && !isTargetCity && !isAllowedCity && !isRemote) {
          failed.push({
            constraint: 'LOCATION',
            expected: loc.target_city || loc.target_country || 'Specified Region',
            actual: opp.location_raw || opp.location_city || opp.location_country || 'Outside region'
          });
        }
      }
    }
  }

  // 3. Compensation Constraint (Three-Tier Enforcement: PAID_VERIFIED vs UNKNOWN vs UNPAID)
  const compCategory = classifyCompensation(opp);
  if (predicates.compensation?.is_mandatory) {
    const allowUnknown = predicates.compensation.allow_unknown === true;
    if (compCategory === 'UNPAID_VERIFIED') {
      failed.push({
        constraint: 'COMPENSATION',
        expected: 'Paid Allowance / Salary Required',
        actual: 'Unpaid / Voluntary'
      });
    } else if (compCategory === 'UNKNOWN_COMPENSATION' && !allowUnknown) {
      failed.push({
        constraint: 'COMPENSATION',
        expected: 'Verified Paid Allowance / Salary Required',
        actual: 'Compensation not disclosed in listing'
      });
    }
  }

  // 4. Deterministic Structured Role Relevance Gate (Runs BEFORE Scoring)
  const roleCheck = evaluateRoleRelevance(opp, compiledConstraints);
  if (!roleCheck.is_match) {
    failed.push({
      constraint: 'ROLE_RELEVANCE',
      expected: predicates.role_relevance?.target_role_family || predicates.role_relevance?.required_keywords?.join(' or ') || 'Role Alignment',
      actual: roleCheck.reason || 'Role mismatch'
    });
  }

  // 5. Experience Limit Constraint
  if (predicates.eligibility?.max_experience_years !== undefined) {
    const expReq = opp.experience_years_required || 0;
    if (expReq > predicates.eligibility.max_experience_years) {
      failed.push({
        constraint: 'EXPERIENCE',
        expected: `<= ${predicates.eligibility.max_experience_years} years experience required`,
        actual: `Requires ${expReq} years professional experience`
      });
    }
  }

  return {
    is_eligible: failed.length === 0,
    failed_constraints: failed,
    compensation_category: compCategory
  };
}

export default { evaluateHardConstraints, classifyCompensation, evaluateRoleRelevance };
