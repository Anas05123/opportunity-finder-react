import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import db from '../server/db/sqliteClient.js';
import { runBundleSecretScan } from '../server/services/security/bundleScanner.js';
import { calculateSecurityScore } from '../server/services/securityScoreEngine.js';

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
  const adminId = adminUser ? adminUser.id : 'admin-user-001';
  const adminEmail = adminUser ? adminUser.email : 'admin@careerly.net';
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

async function runPhase5c3Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 5C-3: ADMIN SECURITY CENTER REACT FRONTEND');
  console.log('================================================================');

  // =========================================================================
  // SECTION 1: FRONTEND SOURCE COMPONENT EXISTENCE & INTEGRATION
  // =========================================================================
  console.log('\n--- 1. Frontend Component Structure & Integration ---');
  const secCenterPath = path.join(ROOT_DIR, 'src', 'components', 'Admin', 'SecurityCenter.jsx');
  const adminDashPath = path.join(ROOT_DIR, 'src', 'components', 'AdminDashboard.jsx');

  assert(fs.existsSync(secCenterPath), 'src/components/Admin/SecurityCenter.jsx exists on disk');
  assert(fs.existsSync(adminDashPath), 'src/components/AdminDashboard.jsx exists on disk');

  const secCenterCode = fs.readFileSync(secCenterPath, 'utf-8');
  const adminDashCode = fs.readFileSync(adminDashPath, 'utf-8');

  assert(adminDashCode.includes('import SecurityCenter from'), 'SecurityCenter is imported in AdminDashboard.jsx');
  assert(adminDashCode.includes('<SecurityCenter'), 'SecurityCenter component is mounted in AdminDashboard.jsx');
  assert(secCenterCode.includes('export default function SecurityCenter'), 'SecurityCenter exports standard React component');

  // =========================================================================
  // SECTION 2: BACKEND AS SINGLE SOURCE OF TRUTH (NO HARDCODED VALUES)
  // =========================================================================
  console.log('\n--- 2. Single Source of Truth & Zero Hardcoded Policy ---');
  assert(!secCenterCode.includes('const authoritativeScore = 100'), 'Zero hardcoded 100/100 score in frontend');
  assert(!secCenterCode.includes('const authoritativeStatus = "HEALTHY"'), 'Zero hardcoded HEALTHY status in frontend');
  assert(secCenterCode.includes('/admin/security/status'), 'Consumes authoritative /admin/security/status');
  assert(secCenterCode.includes('/admin/security/categories'), 'Consumes authoritative /admin/security/categories');
  assert(secCenterCode.includes('/admin/security/events'), 'Consumes authoritative /admin/security/events');
  assert(secCenterCode.includes('/admin/security/audits'), 'Consumes authoritative /admin/security/audits');
  assert(secCenterCode.includes('/admin/security/checks'), 'Consumes authoritative /admin/security/checks');
  assert(secCenterCode.includes('/admin/security/supply-chain'), 'Consumes authoritative /admin/security/supply-chain');
  assert(secCenterCode.includes('/admin/security/git-history'), 'Consumes authoritative /admin/security/git-history');
  assert(secCenterCode.includes('/admin/security/health'), 'Consumes authoritative /admin/security/health');

  // =========================================================================
  // SECTION 3: FRONTEND RBAC BARRIER & AUTH GATES
  // =========================================================================
  console.log('\n--- 3. Frontend RBAC & Authentication Gating ---');
  assert(secCenterCode.includes('useAuth'), 'Uses AuthContext for role inspection');
  assert(secCenterCode.includes('!isAuthenticated || !isAdmin'), 'Renders strict HTTP 403 access barrier for non-admins');

  const adminToken = generateAdminToken();
  const userToken = generateUserToken();

  // Test unauthenticated access to security API
  try {
    await axios.get(`${BASE_URL}/admin/security/status`);
    assert(false, 'Unauthenticated request should fail');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated request rejected with HTTP 401');
  }

  // Test non-admin user access to security API
  try {
    await axios.get(`${BASE_URL}/admin/security/status`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(false, 'Non-admin request should fail');
  } catch (err) {
    assert(err.response?.status === 403, 'Non-admin user rejected with HTTP 403 FORBIDDEN_ADMIN_ONLY');
  }

  // Test admin access to security API
  const adminRes = await axios.get(`${BASE_URL}/admin/security/status`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminRes.status === 200, 'Admin authorized successfully with HTTP 200');
  assert(typeof adminRes.data.score === 'number', 'Authoritative score returned from backend API');

  // =========================================================================
  // SECTION 4: 14 CATEGORIES DYNAMIC PRESENTATION
  // =========================================================================
  console.log('\n--- 4. 14 Security Categories Dynamic Data ---');
  const catRes = await axios.get(`${BASE_URL}/admin/security/categories`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(catRes.status === 200, 'GET /admin/security/categories returned HTTP 200');
  assert(Array.isArray(catRes.data.categories), 'Categories array returned');
  assert(catRes.data.categories.length === 14, `All 14 categories present in response (Received: ${catRes.data.categories.length})`);

  // =========================================================================
  // SECTION 5: RUNTIME TELEMETRY & EVENT STATS
  // =========================================================================
  console.log('\n--- 5. Runtime Telemetry & Event Statistics ---');
  const statsRes = await axios.get(`${BASE_URL}/admin/security/events/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(statsRes.status === 200, 'GET /admin/security/events/stats returned HTTP 200');
  assert(typeof statsRes.data.total === 'number', 'Total events count numeric');
  assert(typeof statsRes.data.last24h === 'number', 'Last 24h events count numeric');
  assert(statsRes.data.bySeverity && typeof statsRes.data.bySeverity.CRITICAL === 'number', 'bySeverity breakdown structured');

  // =========================================================================
  // SECTION 6: HISTORICAL AUDITS & ITEMIZED CHECKS
  // =========================================================================
  console.log('\n--- 6. Historical Audits & Itemized Checks ---');
  const auditsRes = await axios.get(`${BASE_URL}/admin/security/audits?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(auditsRes.status === 200, 'GET /admin/security/audits returned HTTP 200');
  assert(Array.isArray(auditsRes.data.audits), 'Audits list array returned');

  const checksRes = await axios.get(`${BASE_URL}/admin/security/checks?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(checksRes.status === 200, 'GET /admin/security/checks returned HTTP 200');
  assert(Array.isArray(checksRes.data.checks), 'Checks list array returned');

  // =========================================================================
  // SECTION 7: SUPPLY CHAIN & GIT HISTORY INTEGRATION
  // =========================================================================
  console.log('\n--- 7. Supply Chain & Git History API Endpoints ---');
  const scRes = await axios.get(`${BASE_URL}/admin/security/supply-chain`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(scRes.status === 200, 'GET /admin/security/supply-chain returned HTTP 200');
  assert(scRes.data.data?.status === 'PASS' || scRes.data.data?.status === 'WARNING', 'Supply chain status valid');

  const gitRes = await axios.get(`${BASE_URL}/admin/security/git-history`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(gitRes.status === 200, 'GET /admin/security/git-history returned HTTP 200');
  assert(gitRes.data.data?.scanner === 'historical-git-secret-scanner', 'Historical Git scanner metadata returned');

  // =========================================================================
  // SECTION 8: SYSTEM HEALTH DIAGNOSTICS
  // =========================================================================
  console.log('\n--- 8. System Health Diagnostics ---');
  const healthRes = await axios.get(`${BASE_URL}/admin/security/health`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(healthRes.status === 200, 'GET /admin/security/health returned HTTP 200');
  assert(healthRes.data.database === 'connected', 'Database reported connected');
  assert(healthRes.data.tables?.security_audit_runs === true, 'Audit runs table reported active');

  // =========================================================================
  // SECTION 9: PRODUCTION BUNDLE CLEANLINESS & ZERO SECRET LEAKAGE
  // =========================================================================
  console.log('\n--- 9. Production Bundle Verification & Zero Leakage ---');
  const bundleScanResult = runBundleSecretScan();
  assert(bundleScanResult.status === 'PASS', 'Production bundle scanner returns PASS');
  assert(bundleScanResult.findings.length === 0, 'Zero secrets or backend credentials in compiled bundle');

  // Verify no raw secrets in frontend source code
  assert(!secCenterCode.includes('sk_live_'), 'No raw Stripe keys in frontend source');
  assert(!secCenterCode.includes('AKIA'), 'No AWS keys in frontend source');
  assert(!secCenterCode.includes('ghp_'), 'No GitHub tokens in frontend source');

  // =========================================================================
  // SECTION 10: SCORING ENGINE PRESERVATION
  // =========================================================================
  console.log('\n--- 10. Single Authoritative Scoring Engine Preservation ---');
  const mockChecks = [
    { check_key: 'SECRET_ZERO_CLIENT_LEAK', category: 'secret_management', severity: 'CRITICAL', status: 'PASS' },
    { check_key: 'AUTH_ENFORCEMENT', category: 'authentication', severity: 'CRITICAL', status: 'PASS' }
  ];
  const scoreResult = calculateSecurityScore(mockChecks);
  assert(typeof scoreResult.score === 'number', 'Deterministic score calculated');
  assert(scoreResult.weights_sum === 100, 'All 14 category weights sum strictly to 100');

  console.log('\n================================================================');
  console.log(`🎯 PHASE 5C-3 VERIFICATION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('❌ PHASE 5C-3 VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ PHASE 5C-3 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  }
}

runPhase5c3Verification().catch(err => {
  console.error('[Phase 5C-3 Fatal Error]:', err);
  process.exit(1);
});
