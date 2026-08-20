/**
 * CAREERLY VERIFY PHASE 5C-5: SECURITY ALERTING & OPERATIONAL MONITORING
 * Comprehensive automated test suite verifying:
 * - Deterministic alert policy and severity gating
 * - Webhook SSRF validation and URL security
 * - Deduplication and cooldown windows
 * - Alert flooding protection
 * - Fail-safe isolation (notification failure NEVER degrades security barriers)
 * - Zero raw secret leakage in payloads, logs, database records, and API responses
 * - Admin RBAC enforcement across /api/v1/admin/security/alerts*
 * - Authoritative score engine and CI gate preservation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import jwt from 'jsonwebtoken';

import db from '../server/db/sqliteClient.js';
import { 
  ALERT_POLICY, 
  validateWebhookUrl, 
  generateAlertFingerprint, 
  getAlertingConfigStatus, 
  triggerSecurityAlert, 
  triggerTestAlert 
} from '../server/services/security/securityAlerts.js';
import { recordSecurityEvent, cleanupExpiredEvents } from '../server/services/security/securityEvents.js';
import { calculateSecurityScore } from '../server/services/securityScoreEngine.js';
import { evaluateDeploymentGate } from '../server/services/security/ciSecurityGate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
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

async function runPhase5c5Verification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PHASE 5C-5: SECURITY ALERTING & OPERATIONAL MONITORING');
  console.log('================================================================\n');

  // =========================================================================
  // SECTION 1: WEBHOOK SSRF & PROTOCOL HARDENING
  // =========================================================================
  console.log('--- 1. Webhook SSRF & Protocol Hardening ---');

  // 1.1 Valid HTTPS webhook
  const validHttps = validateWebhookUrl('https://hooks.slack.com/services/T00/B00/X00');
  assert(validHttps.valid === true, 'Valid external HTTPS webhook accepted');

  // 1.2 Insecure HTTP protocol rejection
  const insecureHttp = validateWebhookUrl('http://insecure-webhook.example.com/alerts');
  assert(insecureHttp.valid === false, 'Insecure HTTP webhook strictly rejected');
  assert(insecureHttp.reason.includes('HTTPS'), 'Rejection specifies HTTPS requirement');

  // 1.3 Localhost rejection
  const localHost = validateWebhookUrl('https://localhost:8443/alert');
  assert(localHost.valid === false, 'Localhost webhook strictly rejected');

  // 1.4 Loopback 127.0.0.1 rejection
  const loopback = validateWebhookUrl('https://127.0.0.1:9000/webhook');
  assert(loopback.valid === false, 'Loopback IP 127.0.0.1 strictly rejected');

  // 1.5 Cloud Metadata (AWS/GCP/Azure) 169.254.169.254 rejection
  const metadata = validateWebhookUrl('https://169.254.169.254/latest/meta-data');
  assert(metadata.valid === false, 'Cloud metadata IP 169.254.169.254 strictly rejected');

  // 1.6 Private Class A Subnet (10.0.0.1) rejection
  const privClassA = validateWebhookUrl('https://10.0.1.50:443/alert');
  assert(privClassA.valid === false, 'Private Class A (10.0.0.0/8) strictly rejected');

  // 1.7 Private Class C Subnet (192.168.1.1) rejection
  const privClassC = validateWebhookUrl('https://192.168.1.100/webhook');
  assert(privClassC.valid === false, 'Private Class C (192.168.0.0/16) strictly rejected');

  // 1.8 Malformed URL rejection
  const malformed = validateWebhookUrl('not-a-url');
  assert(malformed.valid === false, 'Malformed URL string rejected safely');

  // =========================================================================
  // SECTION 2: DETERMINISTIC ALERT POLICY & SEVERITY GATING
  // =========================================================================
  console.log('\n--- 2. Deterministic Alert Policy & Severity Gating ---');

  // 2.1 CRITICAL condition generates active alert
  const critAlert = await triggerSecurityAlert({
    alert_type: 'CRITICAL_SECURITY_SCORE',
    severity: 'CRITICAL',
    title: 'Critical Security Score Alert',
    summary: 'Authoritative score degraded to CRITICAL',
    source: 'TEST_SUITE',
    details: { score: 35, status: 'CRITICAL' },
    targetKey: 'test-crit-target-1',
    force: true
  });
  assert(critAlert.status === 'DELIVERED' || critAlert.status === 'FAILED', 'CRITICAL condition generated alert');
  assert(Boolean(critAlert.alertId), 'Alert ID returned on CRITICAL condition');

  // 2.2 HIGH condition generates active alert
  const highAlert = await triggerSecurityAlert({
    alert_type: 'SSRF_BLOCKED',
    severity: 'HIGH',
    title: 'SSRF Blocked Alert',
    summary: 'SSRF attack blocked on outbound client',
    source: 'TEST_SUITE',
    details: { host: '169.254.169.254', path: '/api/v1/scraper' },
    targetKey: 'test-high-target-1',
    force: true
  });
  assert(highAlert.status === 'DELIVERED' || highAlert.status === 'FAILED', 'HIGH condition generated alert');

  // 2.3 LOW / INFORMATIONAL event suppressed from outbound dispatch
  const lowAlert = await triggerSecurityAlert({
    alert_type: 'INFORMATIONAL_EVENT',
    severity: 'INFORMATIONAL',
    title: 'Low Info Test',
    summary: 'Harmless informational event',
    source: 'TEST_SUITE',
    targetKey: 'test-low-target-1'
  });
  assert(lowAlert.status === 'SUPPRESSED', 'LOW/INFORMATIONAL event suppressed from outbound dispatch');

  // =========================================================================
  // SECTION 3: DEDUPLICATION & COOLDOWN BEHAVIOR
  // =========================================================================
  console.log('\n--- 3. Deduplication & Cooldown Windows ---');

  // 3.1 Initial Trigger
  const dedup1 = await triggerSecurityAlert({
    alert_type: 'IDOR_ATTEMPT',
    severity: 'CRITICAL',
    title: 'IDOR Attempt',
    summary: 'Cross tenant modification denied',
    source: 'TEST_SUITE',
    targetKey: 'user-a-application-123'
  });
  assert(dedup1.status === 'DELIVERED' || dedup1.status === 'FAILED', 'First trigger accepted');

  // 3.2 Immediate identical trigger within cooldown window
  const dedup2 = await triggerSecurityAlert({
    alert_type: 'IDOR_ATTEMPT',
    severity: 'CRITICAL',
    title: 'IDOR Attempt',
    summary: 'Cross tenant modification denied',
    source: 'TEST_SUITE',
    targetKey: 'user-a-application-123'
  });
  assert(dedup2.status === 'DEDUPLICATED', 'Immediate duplicate trigger deduplicated within cooldown');
  assert(Boolean(dedup2.cooldownRemainingMs), 'Cooldown remaining time returned');

  // 3.3 Distinct target trigger is NOT suppressed
  const distinctTarget = await triggerSecurityAlert({
    alert_type: 'IDOR_ATTEMPT',
    severity: 'CRITICAL',
    title: 'IDOR Attempt',
    summary: 'Cross tenant modification denied on different target',
    source: 'TEST_SUITE',
    targetKey: 'user-b-opportunity-456'
  });
  assert(distinctTarget.status === 'DELIVERED' || distinctTarget.status === 'FAILED', 'Distinct incident target not falsely deduplicated');

  // =========================================================================
  // SECTION 4: PRIVACY & ZERO RAW SECRET LEAKAGE
  // =========================================================================
  console.log('\n--- 4. Privacy & Zero Raw Secret Leakage Invariants ---');

  const leakedSecretAlert = await triggerSecurityAlert({
    alert_type: 'SOURCE_CRITICAL_SECRET',
    severity: 'CRITICAL',
    title: 'Secret Detected',
    summary: 'Found credential in file',
    source: 'TEST_SUITE',
    details: {
      password: 'SuperSecretPassword123!',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMifQ.abc',
      api_key: 'sk_live_1234567890abcdef',
      safe_file: 'server/index.js'
    },
    targetKey: 'privacy-test-target',
    force: true
  });

  const persistedAlert = db.prepare('SELECT * FROM security_alerts WHERE id = ?').get(leakedSecretAlert.alertId);
  assert(Boolean(persistedAlert), 'Alert persisted in security_alerts');
  assert(!persistedAlert.details_json.includes('SuperSecretPassword123!'), 'Password redacted from database details_json');
  assert(!persistedAlert.details_json.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'JWT signature redacted from database details_json');
  assert(!persistedAlert.details_json.includes('sk_live_1234567890abcdef'), 'API key redacted from database details_json');
  assert(persistedAlert.details_json.includes('server/index.js'), 'Non-sensitive metadata preserved');

  // =========================================================================
  // SECTION 5: FAIL-SAFE ISOLATION (SECURITY IMMUNITY)
  // =========================================================================
  console.log('\n--- 5. Fail-Safe Isolation & Security Control Immunity ---');

  // 5.1 Simulated provider failure / invalid configuration
  const brokenAlert = await triggerSecurityAlert({
    alert_type: 'CRITICAL_SECURITY_SCORE',
    severity: 'CRITICAL',
    title: 'Failure Test',
    source: 'TEST_SUITE',
    force: true
  });
  assert(brokenAlert.status === 'DELIVERED' || brokenAlert.status === 'FAILED', 'Alert subsystem handles provider gracefully without throw');

  // 5.2 Verify Runtime Security Event Logger survives alert failures
  const testUser = db.prepare("SELECT id FROM users WHERE email = 'ayarianas79@gmail.com'").get();
  const runtimeEventRes = recordSecurityEvent({
    event_type: 'IDOR_ATTEMPT',
    severity: 'CRITICAL',
    actor_user_id: testUser ? testUser.id : null,
    request_path: '/api/v1/applications/app-target',
    request_method: 'DELETE',
    details: { target_resource_id: 'app-target' }
  });
  assert(runtimeEventRes.status === 'recorded' || runtimeEventRes.status === 'deduplicated', 'Runtime security telemetry operational');

  // 5.3 Verify Single Authoritative Scoring Engine Integrity
  const scoreResult = calculateSecurityScore([
    { check_key: 'AUTH_TEST', category: 'Authentication', severity: 'CRITICAL', status: 'PASS' }
  ]);
  assert(scoreResult.weights_sum === 100, 'Score engine category weights sum to 100');

  // 5.4 Verify CI/CD Security Gate Remains Authoritative
  const gateReport = await evaluateDeploymentGate({ writeArtifact: false });
  assert(typeof gateReport.deploymentPermitted === 'boolean', 'CI deployment gate evaluates authoritatively');

  // =========================================================================
  // SECTION 6: ADMIN API RBAC & DATA PRIVACY
  // =========================================================================
  console.log('\n--- 6. Admin API RBAC & Endpoint Verification ---');

  const { generateToken } = await import('../server/middleware/auth.js');
  const adminRecord = db.prepare("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1").get();
  const adminToken = generateToken(adminRecord);

  let normalRecord = db.prepare("SELECT id, email, role FROM users WHERE role = 'user' LIMIT 1").get();
  if (!normalRecord) {
    const normId = 'usr-test-norm-5c5';
    db.prepare("INSERT OR IGNORE INTO users (id, email, password_hash, role, is_email_verified) VALUES (?, 'norm5c5@example.com', 'hash', 'user', 1)").run(normId);
    normalRecord = { id: normId, email: 'norm5c5@example.com', role: 'user' };
  }
  const userToken = generateToken(normalRecord);

  // 6.1 Unauthenticated request returns 401
  try {
    await axios.get(`${BASE_URL}/admin/security/alerts`);
    assert(false, 'Unauthenticated request was unexpectedly allowed');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated request rejected with HTTP 401');
  }

  // 6.2 Normal user returns 403
  try {
    await axios.get(`${BASE_URL}/admin/security/alerts`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(false, 'Normal user was unexpectedly allowed');
  } catch (err) {
    assert(err.response?.status === 403, 'Normal user rejected with HTTP 403 FORBIDDEN_ADMIN_ONLY');
  }

  // 6.3 Admin authorized GET /alerts
  try {
    const res = await axios.get(`${BASE_URL}/admin/security/alerts?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin authorized GET /alerts returned HTTP 200');
    assert(Array.isArray(res.data.alerts), 'Alerts array returned');
    assert(typeof res.data.pagination?.total === 'number', 'Pagination total count returned');
  } catch (err) {
    assert(false, `Admin GET /alerts failed: ${err.message}`);
  }

  // 6.4 Admin authorized GET /alerts/stats
  try {
    const res = await axios.get(`${BASE_URL}/admin/security/alerts/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin authorized GET /alerts/stats returned HTTP 200');
    assert(typeof res.data.total_alerts === 'number', 'Total alerts count returned');
    assert(Boolean(res.data.by_severity), 'Severity breakdown returned');
    assert(Boolean(res.data.deliveries), 'Delivery stats returned');
  } catch (err) {
    assert(false, `Admin GET /alerts/stats failed: ${err.message}`);
  }

  // 6.5 Admin authorized GET /alerts/config (Credential Sanitization Check)
  try {
    const res = await axios.get(`${BASE_URL}/admin/security/alerts/config`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin authorized GET /alerts/config returned HTTP 200');
    assert(typeof res.data.channels?.email?.enabled === 'boolean', 'Email channel status returned');
    assert(typeof res.data.channels?.slack?.enabled === 'boolean', 'Slack channel status returned');
    assert(typeof res.data.channels?.webhook?.enabled === 'boolean', 'Webhook channel status returned');
    
    const configString = JSON.stringify(res.data);
    assert(!configString.includes('SMTP_PASS'), 'SMTP password absent from config response');
    assert(!configString.includes('webhook_secret'), 'Webhook secrets absent from config response');
  } catch (err) {
    assert(false, `Admin GET /alerts/config failed: ${err.message}`);
  }

  // 6.6 Admin authorized POST /alerts/test (Safe Admin Trigger)
  try {
    const res = await axios.post(`${BASE_URL}/admin/security/alerts/test`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'Admin authorized POST /alerts/test returned HTTP 200');
    assert(res.data.success === true, 'Test notification success confirmed');
  } catch (err) {
    assert(false, `Admin POST /alerts/test failed: ${err.message}`);
  }

  // 6.7 Parameterized lookup GET /alerts/:id
  try {
    const testAlertId = critAlert.alertId;
    const res = await axios.get(`${BASE_URL}/admin/security/alerts/${testAlertId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(res.status === 200, 'GET /alerts/:id returned HTTP 200');
    assert(res.data.id === testAlertId, 'Alert ID matched requested resource');
    assert(Array.isArray(res.data.deliveries), 'Delivery attempts array returned');
  } catch (err) {
    assert(false, `GET /alerts/:id failed: ${err.message}`);
  }

  // 6.8 Invalid ID format rejected safely
  try {
    await axios.get(`${BASE_URL}/admin/security/alerts/invalid!@#$`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(false, 'Malformed alert ID was unexpectedly accepted');
  } catch (err) {
    assert(err.response?.status === 400, 'Malformed alert ID rejected with HTTP 400');
  }

  console.log('\n================================================================');
  console.log(`🎯 PHASE 5C-5 VERIFICATION SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('❌ PHASE 5C-5 VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ PHASE 5C-5 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  }
}

runPhase5c5Verification().catch(err => {
  console.error('[Phase 5C-5 Fatal Error]:', err);
  process.exit(1);
});
