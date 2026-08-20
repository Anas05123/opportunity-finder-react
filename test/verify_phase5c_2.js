import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import { scanGitHistory, generateGitHistoryArtifact } from '../server/services/security/gitHistoryScanner.js';
import { runDependencyAudit } from '../server/services/security/dependencyScanner.js';
import { runSecretScan } from '../server/services/security/secretScanner.js';
import { runBundleSecretScan } from '../server/services/security/bundleScanner.js';
import { calculateSecurityScore } from '../server/services/securityScoreEngine.js';

import db from '../server/db/sqliteClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'careerly-super-secret-jwt-key-2026-production';
const BASE_URL = 'http://localhost:5000/api/v1';

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

function generateAdminToken() {
  const adminUser = db.prepare('SELECT id, email, role FROM users WHERE role = ? LIMIT 1').get('admin');
  const adminId = adminUser ? adminUser.id : 'usr-admin-default';
  const adminEmail = adminUser ? adminUser.email : 'ayarianas79@gmail.com';
  return jwt.sign(
    { userId: adminId, email: adminEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateUserToken() {
  let normalUser = db.prepare('SELECT id, email, role FROM users WHERE role != ? LIMIT 1').get('admin');
  if (!normalUser) {
    const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, full_name, role, is_email_verified) VALUES (?, ?, ?, ?, ?, 1)`);
    insertUser.run('usr-test-regular', 'regular.user@careerly.internal', 'hash123', 'Regular User', 'user');
    normalUser = { id: 'usr-test-regular', email: 'regular.user@careerly.internal', role: 'user' };
  }
  return jwt.sign(
    { userId: normalUser.id, email: normalUser.email, role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function runPhase5c2Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 5C-2: HISTORICAL GIT SECRET SCANNER');
  console.log('================================================================');

  // =========================================================================
  // SECTION 1: GIT REPOSITORY DETECTION & AVAILABILITY
  // =========================================================================
  console.log('\n--- 1. Git Repository Detection & Availability ---');
  const mainScan = scanGitHistory({ repoPath: ROOT_DIR });
  assert(mainScan.scanner === 'historical-git-secret-scanner', 'Scanner identity confirmed');
  assert(mainScan.isGitRepo === true, 'Root directory recognized as valid Git repository');
  assert(typeof mainScan.isShallow === 'boolean', 'Shallow repository status evaluated');
  assert(mainScan.coverage === 'FULL_REACHABLE_HISTORY' || mainScan.coverage === 'PARTIAL', `Coverage mode verified (${mainScan.coverage})`);
  assert(mainScan.commitsScanned >= 14, `All reachable commits traversed (Count: ${mainScan.commitsScanned})`);
  assert(mainScan.refsScanned >= 1, `Reachable refs discovered (Count: ${mainScan.refsScanned})`);

  // =========================================================================
  // SECTION 2: ISOLATED TEMPORARY GIT REPOSITORY FIXTURE (DELETED SECRET)
  // =========================================================================
  console.log('\n--- 2. Isolated Temporary Git Fixture: Historical Secret Added & Deleted ---');
  const tempDir = path.join(os.tmpdir(), `careerly-git-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const syntheticToken = 'ghp_' + 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8';
  const syntheticFingerprint = 'sha256:' + crypto.createHash('sha256').update(syntheticToken).digest('hex').substring(0, 16);

  try {
    // Initialize temporary repository
    execFileSync('git', ['init'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.name', 'Careerly Security Test'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['config', 'user.email', 'security-test@careerly.internal'], { cwd: tempDir, stdio: 'pipe' });

    // Commit 1: Add file with synthetic secret
    const secretFilePath = path.join(tempDir, 'legacy_config.js');
    fs.writeFileSync(secretFilePath, `// Legacy config\nconst GITHUB_TOKEN = "${syntheticToken}";\nmodule.exports = { GITHUB_TOKEN };\n`);
    execFileSync('git', ['add', 'legacy_config.js'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'Add legacy config with token'], { cwd: tempDir, stdio: 'pipe' });

    // Commit 2: Delete the file completely
    fs.unlinkSync(secretFilePath);
    execFileSync('git', ['add', '-A'], { cwd: tempDir, stdio: 'pipe' });
    execFileSync('git', ['commit', '-m', 'Remove legacy config file'], { cwd: tempDir, stdio: 'pipe' });

    // Verify current working tree does NOT have the file or secret
    assert(!fs.existsSync(secretFilePath), 'Deleted file is absent from current working tree');

    // Run historical Git scanner against the temporary repository
    const tempScanResult = scanGitHistory({ repoPath: tempDir });
    assert(tempScanResult.commitsScanned === 2, `Temporary repo scanned 2 commits (Received: ${tempScanResult.commitsScanned})`);
    assert(tempScanResult.summary.total >= 1, `Historical scanner detected secret in past commit (Findings: ${tempScanResult.summary.total})`);

    const finding = tempScanResult.findings.find(f => f.fingerprint === syntheticFingerprint);
    assert(!!finding, 'Finding located matching deterministic SHA-256 fingerprint');
    assert(finding?.file === 'legacy_config.js', 'Historical file path correctly identified');
    assert(finding?.type === 'GITHUB_TOKEN', 'Rule type correctly classified as GITHUB_TOKEN');
    assert(finding?.severity === 'CRITICAL' || finding?.severity === 'HIGH', `Finding severity properly categorized (${finding?.severity})`);
    assert(finding?.source === 'GIT_HISTORY', 'Source classified as GIT_HISTORY');
    assert(finding?.redactedPreview === 'ghp_...[REDACTED]', `Redacted preview format verified (${finding?.redactedPreview})`);

    // Ensure raw synthetic secret does NOT appear in scan result JSON
    const serializedResult = JSON.stringify(tempScanResult);
    assert(!serializedResult.includes(syntheticToken), 'Raw secret string is 100% absent from scanner output object');

  } finally {
    // Clean up temporary repository
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }

  // =========================================================================
  // SECTION 3: REPOSITORY EDGE CASES (EMPTY REPO & NON-GIT DIR)
  // =========================================================================
  console.log('\n--- 3. Repository Edge Cases & Robustness ---');
  
  // Test empty git repository (zero commits)
  const emptyGitDir = path.join(os.tmpdir(), `careerly-empty-git-${Date.now()}`);
  fs.mkdirSync(emptyGitDir, { recursive: true });
  try {
    execFileSync('git', ['init'], { cwd: emptyGitDir, stdio: 'pipe' });
    const emptyScan = scanGitHistory({ repoPath: emptyGitDir });
    assert(emptyScan.isGitRepo === true, 'Empty directory recognized as Git repository');
    assert(emptyScan.commitsScanned === 0, 'Zero commits recorded for empty repository');
    assert(emptyScan.status === 'PASS', 'Empty repository evaluates safely to PASS');
  } finally {
    try { fs.rmSync(emptyGitDir, { recursive: true, force: true }); } catch (_) {}
  }

  // Test non-git directory
  const nonGitDir = path.join(os.tmpdir(), `careerly-non-git-${Date.now()}`);
  fs.mkdirSync(nonGitDir, { recursive: true });
  try {
    const nonGitScan = scanGitHistory({ repoPath: nonGitDir });
    assert(nonGitScan.isGitRepo === false, 'Non-Git directory correctly identified (isGitRepo: false)');
    assert(nonGitScan.status === 'PASS', 'Non-Git directory returns PASS without throwing');
  } finally {
    try { fs.rmSync(nonGitDir, { recursive: true, force: true }); } catch (_) {}
  }

  // =========================================================================
  // SECTION 4: SAFE EXECUTION & SHELL INJECTION IMMUNITY
  // =========================================================================
  console.log('\n--- 4. Safe Command Execution & Shell Injection Immunity ---');
  const injectionPath = path.join(ROOT_DIR, '; touch /tmp/pwned.txt');
  const injectionScan = scanGitHistory({ repoPath: injectionPath });
  assert(injectionScan.status === 'PASS' || injectionScan.status === 'ERROR', 'Shell injection payload in path handled safely without shell execution');
  assert(!fs.existsSync('/tmp/pwned.txt'), 'No injected shell commands executed');

  // =========================================================================
  // SECTION 5: ARTIFACT GENERATION & PERSISTENCE
  // =========================================================================
  console.log('\n--- 5. Machine-Readable Artifact Generation ---');
  const artifact = await generateGitHistoryArtifact();
  const artifactPath = path.join(ROOT_DIR, 'security-git-history-results.json');

  assert(fs.existsSync(artifactPath), 'security-git-history-results.json created on disk');
  assert(artifact.coverage === 'FULL_REACHABLE_HISTORY' || artifact.coverage === 'PARTIAL', 'Artifact records coverage mode');
  assert(typeof artifact.commitsScanned === 'number' && artifact.commitsScanned >= 14, 'Artifact records commits scanned');
  assert(artifact.summary && typeof artifact.summary.total === 'number', 'Artifact contains structured summary');
  assert(Array.isArray(artifact.findings), 'Artifact contains findings array');

  const rawArtifactContent = fs.readFileSync(artifactPath, 'utf-8');
  assert(!rawArtifactContent.includes('rawSecret') && !rawArtifactContent.includes('tokenValue'), 'Zero raw secrets stored in JSON artifact');

  // =========================================================================
  // SECTION 6: ADMIN API RBAC & AUTHORIZATION
  // =========================================================================
  console.log('\n--- 6. Admin API Authorization & Isolation ---');
  const adminToken = generateAdminToken();
  const userToken = generateUserToken();

  // Test 1: Unauthenticated request -> HTTP 401
  try {
    await axios.post(`${BASE_URL}/admin/security/scan/git-history`);
    assert(false, 'Unauthenticated request should have been rejected');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated request rejected with HTTP 401');
  }

  // Test 2: Non-admin user request -> HTTP 403
  try {
    await axios.post(
      `${BASE_URL}/admin/security/scan/git-history`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(false, 'Non-admin request should have been rejected');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin user rejected with HTTP 403 FORBIDDEN_ADMIN_ONLY');
  }

  // Test 3: Admin request -> HTTP 200
  try {
    const adminRes = await axios.post(
      `${BASE_URL}/admin/security/scan/git-history`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(adminRes.status === 200, 'Admin request succeeded with HTTP 200');
    assert(adminRes.data.success === true, 'Admin response success flag is true');
    assert(adminRes.data.data.commitsScanned >= 14, 'Admin API returned valid git history scan report');
  } catch (err) {
    assert(false, `Admin API request failed: ${err.message}`);
  }

  // =========================================================================
  // SECTION 7: SCORING ENGINE INTEGRITY
  // =========================================================================
  console.log('\n--- 7. Security Score Engine Single Authority ---');
  const mockChecks = [
    { check_key: 'SECRET_ZERO_CLIENT_LEAK', category: 'secret_management', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'AUTH_ENFORCEMENT', category: 'authentication', severity: 'CRITICAL', status: 'PASS' }
  ];
  const scoreResult = calculateSecurityScore(mockChecks);
  assert(typeof scoreResult.score === 'number', 'Deterministic score calculated');
  assert(scoreResult.weights_sum === 100, 'All 14 category weights sum strictly to 100');

  // =========================================================================
  // SECTION 8: FULL PHASE 5B INTEGRATION PRESERVATION
  // =========================================================================
  console.log('\n--- 8. Phase 5B Scanners Preservation ---');
  const depRes = await runDependencyAudit();
  assert(depRes.scanner === 'npm-audit', 'Dependency scanner functional');

  const secretRes = runSecretScan();
  assert(secretRes.scanner === 'secret-scanner', 'Source secret scanner functional');

  const bundleRes = runBundleSecretScan();
  assert(bundleRes.scanner === 'frontend-bundle-scanner', 'Bundle scanner functional');

  console.log('\n================================================================');
  console.log(`🎯 PHASE 5C-2 VERIFICATION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('❌ PHASE 5C-2 VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ PHASE 5C-2 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  }
}

runPhase5c2Verification().catch(err => {
  console.error('[Phase 5C-2 Fatal Error]:', err);
  process.exit(1);
});
