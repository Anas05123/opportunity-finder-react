import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { runDependencyAudit, evaluateDependencyAuditJson } from '../server/services/security/dependencyScanner.js';
import { runBundleSecretScan } from '../server/services/security/bundleScanner.js';
import { executeSupplyChainAudit } from '../server/services/security/supplyChainService.js';
import { calculateSecurityScore } from '../server/services/securityScoreEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

async function runPhase5c1Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 5C-1: DEPENDENCY REMEDIATION & LOCKFILE AUDIT');
  console.log('================================================================');

  // =========================================================================
  // SECTION 1: PACKAGE.JSON & DEVDEPENDENCY PLACEMENT
  // =========================================================================
  console.log('\n--- 1. Dependency Structure & Placement ---');
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  assert(fs.existsSync(pkgPath), 'package.json exists on disk');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  assert(pkg.devDependencies && pkg.devDependencies.vite, 'Vite located in devDependencies');
  assert(pkg.devDependencies && pkg.devDependencies['@vitejs/plugin-react'], '@vitejs/plugin-react located in devDependencies');
  assert(!pkg.dependencies || !pkg.dependencies.vite, 'Vite is absent from production runtime dependencies');
  assert(!pkg.dependencies || !pkg.dependencies['@vitejs/plugin-react'], '@vitejs/plugin-react is absent from production runtime dependencies');

  // =========================================================================
  // SECTION 2: INSTALLED PACKAGE VERSIONS
  // =========================================================================
  console.log('\n--- 2. Installed Package Version Verification ---');
  const vitePkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'node_modules', 'vite', 'package.json'), 'utf-8'));
  const esbuildPkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'node_modules', 'esbuild', 'package.json'), 'utf-8'));
  const reactPluginPkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'node_modules', '@vitejs/plugin-react', 'package.json'), 'utf-8'));

  console.log(`  Installed Vite: ${vitePkgJson.version}`);
  console.log(`  Installed esbuild: ${esbuildPkgJson.version}`);
  console.log(`  Installed @vitejs/plugin-react: ${reactPluginPkgJson.version}`);

  const semverGte = (ver, min) => {
    const vParts = ver.split('.').map(n => parseInt(n, 10));
    const mParts = min.split('.').map(n => parseInt(n, 10));
    for (let i = 0; i < 3; i++) {
      if (vParts[i] > mParts[i]) return true;
      if (vParts[i] < mParts[i]) return false;
    }
    return true;
  };

  assert(semverGte(vitePkgJson.version, '6.4.3'), `Vite version >= 6.4.3 (Installed: ${vitePkgJson.version})`);
  assert(semverGte(esbuildPkgJson.version, '0.25.0'), `esbuild version >= 0.25.0 (Installed: ${esbuildPkgJson.version})`);
  assert(semverGte(reactPluginPkgJson.version, '4.3.4'), `@vitejs/plugin-react version >= 4.3.4 (Installed: ${reactPluginPkgJson.version})`);

  // =========================================================================
  // SECTION 3: LIVE NPM AUDIT EXECUTION
  // =========================================================================
  console.log('\n--- 3. Live npm audit Execution & Policy Evaluation ---');
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'cmd.exe' : 'npm';
  const npmArgs = isWindows ? ['/d', '/s', '/c', 'npm audit --json'] : ['audit', '--json'];

  let auditRawOutput = '';
  try {
    auditRawOutput = execFileSync(npmCmd, npmArgs, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout: 20000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true
    });
  } catch (err) {
    auditRawOutput = err.stdout || err.stderr || '{}';
  }

  let auditJson = {};
  try {
    auditJson = JSON.parse(auditRawOutput);
  } catch (e) {
    auditJson = {};
  }

  assert(auditJson.auditReportVersion === 2, 'npm audit report v2 schema received');
  const evaluatedAudit = evaluateDependencyAuditJson(auditJson);
  assert(evaluatedAudit.status === 'PASS', `Dependency evaluation returns PASS (Received: ${evaluatedAudit.status})`);
  assert(evaluatedAudit.summary.critical === 0, '0 Critical vulnerabilities in dependencies');
  assert(evaluatedAudit.summary.high === 0, '0 High vulnerabilities in dependencies');
  assert(evaluatedAudit.summary.medium === 0, '0 Moderate vulnerabilities in dependencies');
  assert(evaluatedAudit.summary.low === 0, '0 Low vulnerabilities in dependencies');

  // =========================================================================
  // SECTION 4: SPECIFIC PHASE 5B CVE RESOLUTION CHECKS
  // =========================================================================
  console.log('\n--- 4. Specific Phase 5B Advisory Resolution Checks ---');
  const knownAdvisories = ['GHSA-fx2h-pf6j-xcff', 'GHSA-67mh-4wv8-2f99', 'GHSA-4w7w-66w2-5vf9', 'GHSA-v6wh-96g9-6wx3'];
  const auditString = JSON.stringify(auditJson);

  for (const adv of knownAdvisories) {
    assert(!auditString.includes(adv), `Advisory ${adv} is completely resolved and absent from audit`);
  }

  // =========================================================================
  // SECTION 5: LOCKFILE INTEGRITY & CONSISTENCY
  // =========================================================================
  console.log('\n--- 5. Lockfile Integrity & Synchronization ---');
  const lockPath = path.join(ROOT_DIR, 'package-lock.json');
  assert(fs.existsSync(lockPath), 'package-lock.json exists on disk');

  const lockContent = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  assert(lockContent.lockfileVersion === 3, 'Lockfile version is 3');
  const lockPackages = lockContent.packages || {};

  const lockVite = lockPackages['node_modules/vite'];
  const lockEsbuild = lockPackages['node_modules/esbuild'];
  const lockPluginReact = lockPackages['node_modules/@vitejs/plugin-react'];

  assert(lockVite && semverGte(lockVite.version, '6.4.3'), `Lockfile pins Vite >= 6.4.3 (${lockVite?.version})`);
  assert(lockEsbuild && semverGte(lockEsbuild.version, '0.25.0'), `Lockfile pins esbuild >= 0.25.0 (${lockEsbuild?.version})`);
  assert(lockPluginReact && semverGte(lockPluginReact.version, '4.3.4'), `Lockfile pins @vitejs/plugin-react >= 4.3.4 (${lockPluginReact?.version})`);

  // =========================================================================
  // SECTION 6: PRODUCTION BUILD INTEGRITY
  // =========================================================================
  console.log('\n--- 6. Production Bundle Build Integrity ---');
  const distHtml = path.join(ROOT_DIR, 'dist', 'index.html');
  const distAssets = path.join(ROOT_DIR, 'dist', 'assets');

  assert(fs.existsSync(distHtml), 'dist/index.html exists');
  assert(fs.existsSync(distAssets), 'dist/assets directory exists');

  const assetFiles = fs.readdirSync(distAssets);
  const jsFiles = assetFiles.filter(f => f.endsWith('.js'));
  const cssFiles = assetFiles.filter(f => f.endsWith('.css'));

  assert(jsFiles.length >= 1, `Compiled JavaScript bundle exists (${jsFiles.join(', ')})`);
  assert(cssFiles.length >= 1, `Compiled CSS bundle exists (${cssFiles.join(', ')})`);

  // =========================================================================
  // SECTION 7: BUNDLE SCANNER & SECRET CLEANLINESS
  // =========================================================================
  console.log('\n--- 7. Frontend Bundle Secret Cleanliness ---');
  const bundleScanResult = runBundleSecretScan();
  assert(bundleScanResult.status === 'PASS', 'Frontend bundle scanner returns PASS');
  assert(bundleScanResult.findings.length === 0, 'Zero secrets or backend credentials in client bundle');

  // =========================================================================
  // SECTION 8: SUPPLY CHAIN ARTIFACT GENERATION
  // =========================================================================
  console.log('\n--- 8. Supply Chain Results Artifact Verification ---');
  const supplyChainArtifact = await executeSupplyChainAudit();
  assert(supplyChainArtifact.status === 'PASS' || supplyChainArtifact.status === 'WARNING', `Supply chain status is valid (Received: ${supplyChainArtifact.status})`);
  assert(supplyChainArtifact.summary.dependencies.critical === 0, 'Supply chain artifact reports 0 critical dependency vulns');
  assert(supplyChainArtifact.summary.dependencies.high === 0, 'Supply chain artifact reports 0 high dependency vulns');
  assert(supplyChainArtifact.summary.secrets.critical === 0, 'Supply chain artifact reports 0 critical source secret leaks');
  assert(supplyChainArtifact.summary.bundle.total === 0, 'Supply chain artifact reports 0 bundle leaks');

  const artifactPath = path.join(ROOT_DIR, 'security-supply-chain-results.json');
  assert(fs.existsSync(artifactPath), 'security-supply-chain-results.json exists on disk');

  // =========================================================================
  // SECTION 9: SECURITY SCORE ENGINE INTEGRATION
  // =========================================================================
  console.log('\n--- 9. Security Score Engine Single Source of Truth ---');
  const all14CategoryChecks = [
    { check_key: 'AUTH_ENFORCEMENT', category: 'authentication', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'TENANT_ISOLATION', category: 'multi_tenant_isolation', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'ADMIN_RBAC', category: 'authorization', severity: 'HIGH', status: 'PASS' },
    { check_key: 'API_INPUT_VALIDATION', category: 'api_security', severity: 'HIGH', status: 'PASS' },
    { check_key: 'SSRF_PROTECTION', category: 'ssrf_defense', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'FILE_MAGIC_BYTES', category: 'file_security', severity: 'HIGH', status: 'PASS' },
    { check_key: 'AI_BOUNDARY_ENFORCEMENT', category: 'ai_security', severity: 'HIGH', status: 'PASS' },
    { check_key: 'RATE_LIMIT_ENFORCEMENT', category: 'rate_limiting', severity: 'MEDIUM', status: 'PASS' },
    { check_key: 'SECURITY_HEADERS', category: 'infrastructure', severity: 'MEDIUM', status: 'PASS' },
    { check_key: 'DEP_PRODUCTION_AUDIT', category: 'dependency_security', severity: 'HIGH', status: 'PASS' },
    { check_key: 'SECRET_ZERO_CLIENT_LEAK', category: 'secret_management', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'AUTOMATED_TEST_RUNNER', category: 'automated_testing', severity: 'MEDIUM', status: 'PASS' },
    { check_key: 'STRICT_CORS', category: 'configuration', severity: 'MEDIUM', status: 'PASS' },
    { check_key: 'SECURITY_EVENTS_SUBSYSTEM', category: 'runtime_security', severity: 'MEDIUM', status: 'PASS' }
  ];
  const scoreResult = calculateSecurityScore(all14CategoryChecks);
  assert(scoreResult.score === 100, `All pass produces 100/100 (Received: ${scoreResult.score})`);
  assert(scoreResult.status === 'HEALTHY', `Score status is HEALTHY (Received: ${scoreResult.status})`);
  const categoryKeys = Object.keys(scoreResult.category_scores || {});
  assert(categoryKeys.length === 14, `All 14 categories present in breakdown (Received: ${categoryKeys.length})`);

  // =========================================================================
  // SECTION 10: PRESERVATION OF SECURITY INFRASTRUCTURE & TESTS
  // =========================================================================
  console.log('\n--- 10. Security Infrastructure & Test Suite Preservation ---');
  const requiredSecurityServices = [
    'server/services/securityAuditRunner.js',
    'server/services/securityScoreEngine.js',
    'server/services/security/securityEvents.js',
    'server/services/security/dependencyScanner.js',
    'server/services/security/secretScanner.js',
    'server/services/security/bundleScanner.js',
    'server/services/security/supplyChainService.js',
    'server/api/security.routes.js'
  ];

  for (const srv of requiredSecurityServices) {
    assert(fs.existsSync(path.join(ROOT_DIR, srv)), `Security service preserved: ${srv}`);
  }

  const requiredTestSuites = [
    'test/security.test.js',
    'test/verify_phase1.js',
    'test/verify_phase2.js',
    'test/verify_phase3.js',
    'test/verify_phase4.js',
    'test/verify_phase4_1.js',
    'test/verify_phase5a.js',
    'test/verify_phase5b.js'
  ];

  for (const tst of requiredTestSuites) {
    assert(fs.existsSync(path.join(ROOT_DIR, tst)), `Test suite preserved: ${tst}`);
  }

  console.log('\n================================================================');
  console.log(`🎯 PHASE 5C-1 VERIFICATION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('❌ PHASE 5C-1 VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ PHASE 5C-1 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  }
}

runPhase5c1Verification().catch(err => {
  console.error('[Phase 5C-1 Fatal Error]:', err);
  process.exit(1);
});
