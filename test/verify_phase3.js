/**
 * PHASE 3 DETERMINISTIC SECURITY SCORE ENGINE VERIFICATION
 * Tests all 12 mandatory scoring rules, category breakdowns, critical failure overrides,
 * audit freshness TTL, NOT_RUN detection, and mathematical reproducibility.
 */

import { SCORING_POLICY, calculateSecurityScore } from '../server/services/securityScoreEngine.js';
import { executeSecurityAudit } from '../server/services/securityAuditRunner.js';
import db from '../server/db/sqliteClient.js';

async function runPhase3Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 3: DETERMINISTIC SECURITY SCORE ENGINE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // Generate a mock complete passing check suite across all 14 categories
  const createMockPassingSuite = () => {
    const checks = [];
    for (const [catName, catConfig] of Object.entries(SCORING_POLICY.categories)) {
      checks.push({
        id: `chk-${catName}-1`,
        check_key: `CHK_${catName.toUpperCase().replace(/\s+/g, '_')}_1`,
        category: catName,
        name: `${catName} Verification Check`,
        severity: ['Authentication', 'Authorization', 'Multi-Tenant Isolation', 'SSRF Protection'].includes(catName) ? 'CRITICAL' : 'HIGH',
        status: 'PASS'
      });
    }
    return checks;
  };

  // -------------------------------------------------------------
  // TEST 1: All checks PASS
  // -------------------------------------------------------------
  console.log('--- Test 1: All checks PASS ---');
  const allPassSuite = createMockPassingSuite();
  const res1 = calculateSecurityScore(allPassSuite);
  assert(res1.score === 100, `All PASS produces 100/100 (Received: ${res1.score})`);
  assert(res1.status === 'HEALTHY', `All PASS produces HEALTHY status (Received: ${res1.status})`);
  assert(res1.weights_sum === 100, `Weights sum equals exactly 100 (Received: ${res1.weights_sum})`);

  // -------------------------------------------------------------
  // TEST 2: One LOW check FAILS
  // -------------------------------------------------------------
  console.log('\n--- Test 2: One LOW check FAILS ---');
  const lowFailSuite = createMockPassingSuite();
  lowFailSuite.push({
    id: 'chk-config-low-fail',
    category: 'Configuration',
    name: 'Minor Config Header Check',
    severity: 'LOW',
    status: 'FAIL'
  });
  const res2 = calculateSecurityScore(lowFailSuite);
  assert(res2.score < 100, `Score decreases when LOW check fails (Received: ${res2.score})`);
  assert(res2.status === 'HEALTHY', `Status remains HEALTHY if above threshold (Received: ${res2.status})`);

  // -------------------------------------------------------------
  // TEST 3: One HIGH check FAILS
  // -------------------------------------------------------------
  console.log('\n--- Test 3: One HIGH check FAILS ---');
  const highFailSuite = createMockPassingSuite();
  const fileSecIdx = highFailSuite.findIndex(c => c.category === 'File Security');
  highFailSuite[fileSecIdx].status = 'FAIL';
  highFailSuite[fileSecIdx].severity = 'HIGH';
  const res3 = calculateSecurityScore(highFailSuite);
  assert(res3.score === 93, `Score deducted exactly category weight (Received: ${res3.score}/100)`);
  assert(res3.category_scores['File Security'].score === 0, 'File Security category score is 0');

  // -------------------------------------------------------------
  // TEST 4: One CRITICAL authentication check FAILS
  // -------------------------------------------------------------
  console.log('\n--- Test 4: CRITICAL Authentication Failure Override ---');
  const critAuthSuite = createMockPassingSuite();
  const authIdx = critAuthSuite.findIndex(c => c.category === 'Authentication');
  critAuthSuite[authIdx].status = 'FAIL';
  critAuthSuite[authIdx].severity = 'CRITICAL';
  critAuthSuite[authIdx].error = 'JWT signature verification bypassed';
  const res4 = calculateSecurityScore(critAuthSuite);
  assert(res4.score === 90, `Score is mathematically 90/100 (Received: ${res4.score})`);
  assert(res4.status === 'CRITICAL', `CRITICAL status overrides high numerical score (Received: ${res4.status})`);
  assert(res4.critical_failures.length === 1, `Critical failure properly flagged: ${res4.critical_failures[0].category}`);

  // -------------------------------------------------------------
  // TEST 5: Multi-tenant isolation FAILS
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Multi-Tenant Isolation (IDOR) Failure ---');
  const idorSuite = createMockPassingSuite();
  const idorIdx = idorSuite.findIndex(c => c.category === 'Multi-Tenant Isolation');
  idorSuite[idorIdx].status = 'FAIL';
  idorSuite[idorIdx].severity = 'CRITICAL';
  idorSuite[idorIdx].error = 'Cross-tenant resource access detected';
  const res5 = calculateSecurityScore(idorSuite);
  assert(res5.status === 'CRITICAL', `Multi-tenant IDOR failure forces CRITICAL status (Received: ${res5.status})`);

  // -------------------------------------------------------------
  // TEST 6: SSRF protection FAILS
  // -------------------------------------------------------------
  console.log('\n--- Test 6: SSRF Protection Failure ---');
  const ssrfSuite = createMockPassingSuite();
  const ssrfIdx = ssrfSuite.findIndex(c => c.category === 'SSRF Protection');
  ssrfSuite[ssrfIdx].status = 'FAIL';
  ssrfSuite[ssrfIdx].severity = 'CRITICAL';
  ssrfSuite[ssrfIdx].error = 'Private IP 169.254.169.254 was reached';
  const res6 = calculateSecurityScore(ssrfSuite);
  assert(res6.status === 'CRITICAL', `SSRF failure forces CRITICAL status (Received: ${res6.status})`);

  // -------------------------------------------------------------
  // TEST 7: Secret exposure occurs
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Secret Exposure Failure ---');
  const secretSuite = createMockPassingSuite();
  const secIdx = secretSuite.findIndex(c => c.category === 'Secret Management');
  secretSuite[secIdx].status = 'FAIL';
  secretSuite[secIdx].severity = 'CRITICAL';
  secretSuite[secIdx].error = 'JWT Secret leaked into frontend bundle';
  const res7 = calculateSecurityScore(secretSuite);
  assert(res7.status === 'CRITICAL', `Secret exposure forces CRITICAL status (Received: ${res7.status})`);

  // -------------------------------------------------------------
  // TEST 8: Required category is NOT_RUN
  // -------------------------------------------------------------
  console.log('\n--- Test 8: NOT_RUN Category Handling ---');
  const partialSuite = createMockPassingSuite().filter(c => c.category !== 'Dependency Security');
  const res8 = calculateSecurityScore(partialSuite, { requireAllCategories: true });
  assert(res8.status === 'NOT_VERIFIED', `Missing category forces NOT_VERIFIED status (Received: ${res8.status})`);
  assert(res8.is_not_verified === true, 'is_not_verified flag is true');

  // -------------------------------------------------------------
  // TEST 9: Audit is older than configured TTL (24 hours)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Outdated Audit Freshness (TTL Overdue) ---');
  const pastDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
  const res9 = calculateSecurityScore(createMockPassingSuite(), {
    completedAt: pastDate,
    ttlHours: 24
  });
  assert(res9.status === 'SECURITY_VERIFICATION_OUTDATED', `Expired TTL forces SECURITY_VERIFICATION_OUTDATED (Received: ${res9.status})`);
  assert(res9.is_outdated === true, 'is_outdated flag is true');

  // -------------------------------------------------------------
  // TEST 10: Pure Mathematical Determinism
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Reproducibility & Determinism ---');
  const suiteA = createMockPassingSuite();
  const suiteB = createMockPassingSuite();
  const resA = calculateSecurityScore(suiteA);
  const resB = calculateSecurityScore(suiteB);
  assert(resA.score === resB.score, `Scores match identically: ${resA.score} === ${resB.score}`);
  assert(resA.status === resB.status, `Statuses match identically: ${resA.status} === ${resB.status}`);
  assert(JSON.stringify(resA.category_scores) === JSON.stringify(resB.category_scores), 'Category breakdown matches byte-for-byte');

  // -------------------------------------------------------------
  // TEST 11: Score cannot exceed 100
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Score Upper Boundary (<= 100) ---');
  const excessiveSuite = createMockPassingSuite();
  for (let i = 0; i < 50; i++) {
    excessiveSuite.push({ category: 'Authentication', severity: 'LOW', status: 'PASS' });
  }
  const res11 = calculateSecurityScore(excessiveSuite);
  assert(res11.score === 100, `Score is capped at 100 (Received: ${res11.score})`);

  // -------------------------------------------------------------
  // TEST 12: Score cannot fall below 0
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Score Lower Boundary (>= 0) ---');
  const allFailSuite = createMockPassingSuite().map(c => ({ ...c, status: 'FAIL' }));
  const res12 = calculateSecurityScore(allFailSuite);
  assert(res12.score === 0, `All FAIL produces 0/100 (Received: ${res12.score})`);

  // -------------------------------------------------------------
  // TEST 13: Live Database Score Persistence
  // -------------------------------------------------------------
  console.log('\n--- Test 13: Live Audit Execution & Score Persistence ---');
  const realAudit = await executeSecurityAudit({ triggeredBy: 'phase3_verification' });
  assert(typeof realAudit.audit_run.score === 'number', `Real audit computed numeric score: ${realAudit.audit_run.score}/100`);
  assert(realAudit.audit_run.status === 'HEALTHY', `Real audit received status: ${realAudit.audit_run.status}`);

  const dbRow = db.prepare('SELECT score, status FROM security_audit_runs WHERE id = ?').get(realAudit.audit_run.id);
  assert(dbRow.score === realAudit.audit_run.score, `SQLite persisted score matches: ${dbRow.score}`);
  assert(dbRow.status === 'HEALTHY', `SQLite persisted status matches: ${dbRow.status}`);

  // Summary
  console.log('\n================================================================');
  console.log(`🎯 PHASE 3 VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('✅ PHASE 3 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  } else {
    console.error('❌ PHASE 3 VERIFICATION FAILED');
    process.exit(1);
  }
}

runPhase3Verification().catch(e => {
  console.error('[Phase 3 Verification Error]:', e);
  process.exit(1);
});
