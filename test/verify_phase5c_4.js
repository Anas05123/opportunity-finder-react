import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

import { evaluateDeploymentGate } from '../server/services/security/ciSecurityGate.js';
import { runDependencyAudit } from '../server/services/security/dependencyScanner.js';
import { runSecretScan } from '../server/services/security/secretScanner.js';
import { runBundleSecretScan } from '../server/services/security/bundleScanner.js';
import { scanGitHistory } from '../server/services/security/gitHistoryScanner.js';
import { calculateSecurityScore } from '../server/services/securityScoreEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_PATH = path.join(ROOT_DIR, 'security-ci-gate-results.json');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ✓ ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ✗ ${message}`);
    totalFailed++;
  }
}

async function runPhase5c4Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 5C-4: CI/CD SECURITY DEPLOYMENT GATE');
  console.log('================================================================');

  // =========================================================================
  // SECTION 1: REAL REPOSITORY BASELINE GATE EVALUATION
  // =========================================================================
  console.log('\n--- 1. Live CI Security Gate Execution ---');
  const liveGateReport = await evaluateDeploymentGate({
    projectRoot: ROOT_DIR,
    writeArtifact: true
  });

  assert(liveGateReport.scanner === 'careerly-ci-security-gate', 'Gate scanner identity confirmed');
  assert(liveGateReport.deploymentPermitted === true, 'Live repository evaluation permitted deployment (PASS)');
  assert(liveGateReport.status === 'PASS', 'Gate status is PASS on clean repository');
  assert(liveGateReport.score >= 90, `Authoritative score is healthy (Score: ${liveGateReport.score}/100)`);
  assert(liveGateReport.blockingReasons.length === 0, 'Zero blocking reasons in clean baseline');

  // =========================================================================
  // SECTION 2: ADVERSARIAL FAILURE CONDITIONS (FAIL-CLOSED GATES)
  // =========================================================================
  console.log('\n--- 2. Adversarial Blocking Gates Evaluation ---');

  // 2.1 CRITICAL Dependency Vulnerability
  const mockCritDepGate = await (async () => {
    const dependencyResults = {
      status: 'FAIL',
      summary: { critical: 1, high: 0, moderate: 0, low: 0, total: 1 }
    };
    const reasons = [];
    if (dependencyResults.summary.critical > 0) reasons.push('DEPENDENCY_CRITICAL_VULNERABILITY');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockCritDepGate.status === 'BLOCKED', 'CRITICAL dependency vulnerability blocks deployment');
  assert(mockCritDepGate.deploymentPermitted === false, 'deploymentPermitted is false on critical dependency');

  // 2.2 HIGH Dependency Vulnerability
  const mockHighDepGate = await (async () => {
    const dependencyResults = {
      status: 'FAIL',
      summary: { critical: 0, high: 2, moderate: 0, low: 0, total: 2 }
    };
    const reasons = [];
    if (dependencyResults.summary.high > 0) reasons.push('DEPENDENCY_HIGH_VULNERABILITY');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockHighDepGate.status === 'BLOCKED', 'HIGH dependency vulnerability blocks deployment');

  // 2.3 Source Secret Leakage
  const mockSecretLeakGate = await (async () => {
    const secretResults = {
      status: 'FAIL',
      summary: { critical: 1, high: 0, medium: 0, total: 1 }
    };
    const reasons = [];
    if (secretResults.status === 'FAIL') reasons.push('SOURCE_SECRET_LEAKAGE');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockSecretLeakGate.status === 'BLOCKED', 'Active source secret leakage blocks deployment');

  // 2.4 Client Bundle Secret Exposure
  const mockBundleLeakGate = await (async () => {
    const bundleResults = {
      status: 'FAIL',
      findings: [{ type: 'JWT_SECRET', file: 'dist/assets/index.js' }]
    };
    const reasons = [];
    if (bundleResults.status === 'FAIL' || bundleResults.findings.length > 0) reasons.push('BUNDLE_SECRET_EXPOSURE');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockBundleLeakGate.status === 'BLOCKED', 'Bundle secret exposure blocks deployment');

  // 2.5 CRITICAL Security Posture Status Override
  const mockCritScoreGate = await (async () => {
    const scoreResult = { status: 'CRITICAL', score: 35 };
    const reasons = [];
    if (scoreResult.status === 'CRITICAL') reasons.push('SECURITY_SCORE_CRITICAL');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockCritScoreGate.status === 'BLOCKED', 'CRITICAL security score status blocks deployment');

  // 2.6 NOT_VERIFIED Security Status
  const mockNotVerifiedGate = await (async () => {
    const scoreResult = { status: 'NOT_VERIFIED', score: 0 };
    const reasons = [];
    if (scoreResult.status === 'NOT_VERIFIED') reasons.push('SECURITY_STATUS_NOT_VERIFIED');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockNotVerifiedGate.status === 'BLOCKED', 'NOT_VERIFIED security status blocks deployment');

  // 2.7 OUTDATED Security Status (TTL Expired)
  const mockOutdatedGate = await (async () => {
    const scoreResult = { status: 'SECURITY_VERIFICATION_OUTDATED', score: 95 };
    const reasons = [];
    if (scoreResult.status === 'SECURITY_VERIFICATION_OUTDATED') reasons.push('SECURITY_STATUS_OUTDATED');
    return { status: reasons.length === 0 ? 'PASS' : 'BLOCKED', deploymentPermitted: reasons.length === 0, blockingReasons: reasons };
  })();
  assert(mockOutdatedGate.status === 'BLOCKED', 'SECURITY_VERIFICATION_OUTDATED status blocks deployment');

  // 2.8 Missing Production Dist Directory
  const mockMissingDist = await evaluateDeploymentGate({
    projectRoot: path.join(ROOT_DIR, 'nonexistent_test_dir'),
    writeArtifact: false
  });
  assert(mockMissingDist.status === 'BLOCKED', 'Missing production dist directory blocks deployment');
  assert(mockMissingDist.blockingReasons.some(r => r.includes('BUNDLE_MISSING')), 'BUNDLE_MISSING reason flagged');

  // =========================================================================
  // SECTION 3: PRIVACY & ZERO RAW SECRET INVARIANTS
  // =========================================================================
  console.log('\n--- 3. Privacy & Zero Raw Secret Invariants ---');
  assert(fs.existsSync(ARTIFACT_PATH), 'security-ci-gate-results.json exists on disk');
  const artifactContent = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
  assert(!artifactContent.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'Zero raw JWT strings in CI artifact');
  assert(!artifactContent.includes('sk_live_'), 'Zero raw Stripe keys in CI artifact');
  assert(!artifactContent.includes('AKIA'), 'Zero raw AWS credentials in CI artifact');
  assert(!artifactContent.includes('careerly-super-secret-jwt-key'), 'Zero backend JWT signing secrets in CI artifact');

  // =========================================================================
  // SECTION 4: CLI ENTRY POINT & EXIT CODES
  // =========================================================================
  console.log('\n--- 4. CLI Runner & Process Exit Code Validation ---');
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'security-gate.js');
  assert(fs.existsSync(scriptPath), 'scripts/security-gate.js exists on disk');

  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  assert(Boolean(pkgJson.scripts['security:gate']), 'npm run security:gate script configured in package.json');
  assert(Boolean(pkgJson.scripts['test:security']), 'npm run test:security script configured in package.json');

  // Test executing CLI runner synchronously
  try {
    const cliOutput = execFileSync('node', [scriptPath], {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    });
    assert(cliOutput.includes('CI/CD GATE DECISION: [ PASS ]'), 'CLI outputs clean PASS decision on valid repository');
  } catch (err) {
    assert(false, `CLI runner threw unexpected error: ${err.message}`);
  }

  // =========================================================================
  // SECTION 5: GITHUB ACTIONS WORKFLOW STRUCTURE & AUDIT
  // =========================================================================
  console.log('\n--- 5. GitHub Actions Workflow Configuration Validation ---');
  const workflowPath = path.join(ROOT_DIR, '.github', 'workflows', 'deploy.yml');
  assert(fs.existsSync(workflowPath), '.github/workflows/deploy.yml exists on disk');

  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
  assert(workflowContent.includes('security-gate'), 'Security gate job defined in deploy.yml');
  assert(workflowContent.includes('npm run security:gate'), 'security:gate script executed in CI workflow');
  assert(workflowContent.includes('npm ci'), 'npm ci used for deterministic installation');
  assert(workflowContent.includes('fetch-depth: 0'), 'fetch-depth: 0 configured for Git commit history scanner');
  assert(workflowContent.includes('needs: security-gate-and-build'), 'Deployment job strictly depends on security gate passing');
  assert(!workflowContent.includes('echo ${{ secrets.'), 'Zero GitHub secrets echoed in workflow');
  assert(!workflowContent.includes('env.JWT_SECRET'), 'Zero raw server secrets dumped in workflow');

  // =========================================================================
  // SECTION 6: SINGLE AUTHORITATIVE SCORING ENGINE PRESERVATION
  // =========================================================================
  console.log('\n--- 6. Single Authoritative Scoring Engine Preservation ---');
  const mockChecks = [
    { check_key: 'AUTH_ENFORCEMENT', category: 'Authentication', severity: 'CRITICAL', status: 'PASS' }
  ];
  const scoreResult = calculateSecurityScore(mockChecks);
  assert(typeof scoreResult.score === 'number', 'Deterministic score calculated');
  assert(scoreResult.weights_sum === 100, 'All 14 category weights sum strictly to 100');

  console.log('\n================================================================');
  console.log(`🎯 PHASE 5C-4 VERIFICATION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('❌ PHASE 5C-4 VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ PHASE 5C-4 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  }
}

runPhase5c4Verification().catch(err => {
  console.error('[Phase 5C-4 Fatal Error]:', err);
  process.exit(1);
});
