/**
 * CAREERLY DETERMINISTIC SECURITY SCORE ENGINE (PHASE 3)
 * Pure, reproducible security scoring system based on 14 weighted security categories.
 * 
 * ABSOLUTE RULE: Zero hardcoded scores. Every score is mathematically derived from
 * itemized check records and evaluated against deterministic severity and freshness rules.
 */

/**
 * Explicit Deterministic Category Weighting Policy (Total = exactly 100)
 */
export const SCORING_POLICY = {
  categories: {
    'Authentication': { weight: 10, description: 'JWT signature integrity, token expiration, password security' },
    'Authorization': { weight: 10, description: 'Role-based access control, admin route protection' },
    'Multi-Tenant Isolation': { weight: 15, description: 'Zero Horizontal IDOR, tenant data isolation' },
    'API Security': { weight: 8, description: 'Input validation, parameterized SQL, safe error handling' },
    'SSRF Protection': { weight: 10, description: 'DNS resolution, loopback/private subnet quarantine' },
    'File Security': { weight: 7, description: 'PDF magic-byte validation, upload size bounds, traversal defense' },
    'AI Security': { weight: 7, description: 'Prompt injection quarantine, XML boundary isolation' },
    'Rate Limiting': { weight: 7, description: 'Tiered rate limiting across Auth, AI, Search, and Email' },
    'Security Headers': { weight: 5, description: 'CSP, HSTS, X-Content-Type-Options, X-Frame-Options' },
    'Dependency Security': { weight: 5, description: 'Vulnerability analysis across runtime dependencies' },
    'Secret Management': { weight: 5, description: 'Zero secret leakage in client builds or logs' },
    'Automated Testing': { weight: 5, description: 'Automated penetration and regression test coverage' },
    'Configuration': { weight: 3, description: 'CORS origins allowlist, environment boundaries' },
    'Runtime Security': { weight: 3, description: 'Security event logging and real-time defense triggers' }
  },
  thresholds: {
    HEALTHY: 90,
    WARNING: 75,
    DEGRADED: 50
  },
  defaultTtlHours: 24,
  warningCreditFactor: 0.5 // WARNING status receives 50% partial credit
};

/**
 * Standardize category name from checks to scoring policy keys
 */
export function normalizeCategoryName(rawCategory) {
  if (!rawCategory) return 'Configuration';
  const cleaned = String(rawCategory).trim().toLowerCase().replace(/[-_]/g, ' ');
  
  if (cleaned.includes('auth') && cleaned.includes('admin') || cleaned === 'authorization') return 'Authorization';
  if (cleaned.includes('auth') || cleaned === 'authentication') return 'Authentication';
  if (cleaned.includes('tenant') || cleaned.includes('idor') || cleaned === 'multi tenant isolation') return 'Multi-Tenant Isolation';
  if (cleaned.includes('ssrf')) return 'SSRF Protection';
  if (cleaned.includes('file') || cleaned.includes('pdf')) return 'File Security';
  if (cleaned.includes('ai') || cleaned.includes('prompt')) return 'AI Security';
  if (cleaned.includes('rate') || cleaned.includes('limit')) return 'Rate Limiting';
  if (cleaned.includes('header') || cleaned === 'infrastructure') return 'Security Headers';
  if (cleaned.includes('dep') || cleaned.includes('npm')) return 'Dependency Security';
  if (cleaned.includes('secret') || cleaned.includes('credential')) return 'Secret Management';
  if (cleaned.includes('test') || cleaned.includes('regression')) return 'Automated Testing';
  if (cleaned.includes('api') || cleaned.includes('sql')) return 'API Security';
  if (cleaned.includes('runtime') || cleaned.includes('event')) return 'Runtime Security';
  if (cleaned.includes('config') || cleaned.includes('cors')) return 'Configuration';

  return 'Configuration';
}

/**
 * Pure Deterministic Security Score Calculation Function
 * 
 * @param {Array} checks - List of security check objects { category, severity, status, ... }
 * @param {Object} options - { ttlHours: 24, completedAt: Date/String, requireAllCategories: false }
 * @returns {Object} Score breakdown, category scores, and final status
 */
export function calculateSecurityScore(checks = [], options = {}) {
  const ttlHours = options.ttlHours || SCORING_POLICY.defaultTtlHours;
  const completedAt = options.completedAt ? new Date(options.completedAt) : new Date();

  // 1. Group checks by normalized category
  const categoryGroups = {};
  for (const catName of Object.keys(SCORING_POLICY.categories)) {
    categoryGroups[catName] = [];
  }

  let criticalFailureFound = false;
  const criticalFailures = [];

  for (const check of checks) {
    const normCat = normalizeCategoryName(check.category);
    if (!categoryGroups[normCat]) categoryGroups[normCat] = [];
    categoryGroups[normCat].push(check);

    // Critical Failure Detection
    if (check.severity === 'CRITICAL' && check.status === 'FAIL') {
      criticalFailureFound = true;
      criticalFailures.push({
        check_key: check.check_key || check.id,
        name: check.name,
        category: normCat,
        error: check.error_message || check.error || 'Critical security assertion failed'
      });
    }
  }

  // 2. Calculate category scores
  const categoryScores = {};
  let rawTotalScore = 0;
  let hasNotRunCategory = false;

  for (const [catName, catConfig] of Object.entries(SCORING_POLICY.categories)) {
    const catChecks = categoryGroups[catName] || [];
    const maxCatPoints = catConfig.weight;

    if (catChecks.length === 0) {
      // Category was not tested at all
      if (options.requireAllCategories) {
        hasNotRunCategory = true;
      }
      categoryScores[catName] = {
        score: 0,
        max_score: maxCatPoints,
        percentage: 0,
        checks_count: 0,
        passed_count: 0,
        failed_count: 0,
        status: 'NOT_RUN'
      };
      continue;
    }

    let catPassed = 0;
    let catFailed = 0;
    let catWarning = 0;
    let catNotRun = 0;
    let earnedPointsSum = 0;
    const pointsPerCheck = maxCatPoints / catChecks.length;

    for (const chk of catChecks) {
      if (chk.status === 'PASS') {
        catPassed++;
        earnedPointsSum += pointsPerCheck;
      } else if (chk.status === 'WARNING') {
        catWarning++;
        earnedPointsSum += pointsPerCheck * SCORING_POLICY.warningCreditFactor;
      } else if (chk.status === 'FAIL') {
        catFailed++;
      } else if (chk.status === 'NOT_RUN') {
        catNotRun++;
        hasNotRunCategory = true;
      }
    }

    // Round earned points to 2 decimal places
    const catEarnedScore = Math.min(maxCatPoints, Math.max(0, Math.round(earnedPointsSum * 100) / 100));
    rawTotalScore += catEarnedScore;

    let catStatus = 'PASS';
    if (catFailed > 0) catStatus = 'FAIL';
    else if (catWarning > 0) catStatus = 'WARNING';
    else if (catNotRun > 0) catStatus = 'NOT_RUN';

    categoryScores[catName] = {
      score: catEarnedScore,
      max_score: maxCatPoints,
      percentage: Math.round((catEarnedScore / maxCatPoints) * 100),
      checks_count: catChecks.length,
      passed_count: catPassed,
      failed_count: catFailed,
      warning_count: catWarning,
      not_run_count: catNotRun,
      status: catStatus
    };
  }

  // Bound overall score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, Math.round(rawTotalScore * 10) / 10));

  // 3. Determine Overall Status with Deterministic Overrides
  let status = 'HEALTHY';
  const now = new Date();
  const ageHours = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
  const isOutdated = ageHours > ttlHours;

  if (criticalFailureFound) {
    status = 'CRITICAL';
  } else if (hasNotRunCategory) {
    status = 'NOT_VERIFIED';
  } else if (isOutdated) {
    status = 'SECURITY_VERIFICATION_OUTDATED';
  } else if (finalScore >= SCORING_POLICY.thresholds.HEALTHY) {
    status = 'HEALTHY';
  } else if (finalScore >= SCORING_POLICY.thresholds.WARNING) {
    status = 'WARNING';
  } else if (finalScore >= SCORING_POLICY.thresholds.DEGRADED) {
    status = 'DEGRADED';
  } else {
    status = 'CRITICAL';
  }

  return {
    score: finalScore,
    status,
    category_scores: categoryScores,
    critical_failures: criticalFailures,
    is_outdated: isOutdated,
    is_not_verified: hasNotRunCategory,
    audit_age_hours: Math.round(ageHours * 10) / 10,
    ttl_hours: ttlHours,
    total_checks: checks.length,
    weights_sum: Object.values(SCORING_POLICY.categories).reduce((acc, c) => acc + c.weight, 0)
  };
}

export default {
  SCORING_POLICY,
  normalizeCategoryName,
  calculateSecurityScore
};
