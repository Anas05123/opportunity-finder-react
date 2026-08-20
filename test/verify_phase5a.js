/**
 * PHASE 5A — ADMIN SECURITY CENTER BACKEND API VERIFICATION SUITE
 * Comprehensive verification of /api/v1/admin/security endpoints:
 * - Authentication & Authorization enforcement
 * - Read-only immutability
 * - Authoritative score derivation
 * - Parametric SQL Injection & BOLA immunity
 * - Pagination & filter validation
 * - Output privacy & zero secret exposure
 * - Operational health reporting
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import db from '../server/db/sqliteClient.js';
import { SCORING_POLICY } from '../server/services/securityScoreEngine.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const SEC_URL = `${BASE_URL}/admin/security`;
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'careerly-super-secret-jwt-key-2026-production';

async function runPhase5aVerification() {
  console.log('================================================================');
  console.log('🛡️  VERIFYING PHASE 5A: ADMIN SECURITY CENTER API');
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

  // 1. Setup Admin and Normal User Tokens
  const adminUser = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('admin');
  if (!adminUser) {
    throw new Error('No administrator user found in database. Seed admin before testing.');
  }

  const adminToken = jwt.sign(
    { userId: adminUser.id, email: adminUser.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  let normalUser = db.prepare('SELECT * FROM users WHERE role != ? LIMIT 1').get('admin');
  const normalUserId = normalUser ? normalUser.id : 'usr-auditor-normal';
  const normalToken = jwt.sign(
    { userId: normalUserId, email: 'normal.auditor@careerly.net', role: 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const normalHeaders = { Authorization: `Bearer ${normalToken}` };

  // -------------------------------------------------------------
  // 1. Authentication & Authorization Enforcement
  // -------------------------------------------------------------
  console.log('--- 1. Authentication & Authorization Gates ---');

  // Test 1: Unauthenticated -> 401
  let unauthCode = null;
  try {
    await axios.get(`${SEC_URL}/status`);
  } catch (err) {
    unauthCode = err.response?.status;
  }
  assert(unauthCode === 401, 'Unauthenticated request rejected with HTTP 401');

  // Test 2: Normal user -> 403
  let normalCode = null;
  try {
    await axios.get(`${SEC_URL}/status`, { headers: normalHeaders });
  } catch (err) {
    normalCode = err.response?.status;
  }
  assert(normalCode === 403, 'Normal user request rejected with HTTP 403');

  // Test 3: Admin user -> 200
  let adminRes = null;
  try {
    adminRes = await axios.get(`${SEC_URL}/status`, { headers: adminHeaders });
  } catch (err) {
    adminRes = err.response;
  }
  assert(adminRes?.status === 200, `Admin authenticated successfully (HTTP 200)`);

  // Test 4: Forged JWT -> 401
  let forgedCode = null;
  try {
    await axios.get(`${SEC_URL}/status`, {
      headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' }
    });
  } catch (err) {
    forgedCode = err.response?.status;
  }
  assert(forgedCode === 401, 'Forged JWT signature rejected with HTTP 401');

  // Test 5: Expired JWT -> 401
  const expiredToken = jwt.sign(
    { userId: adminUser.id, email: adminUser.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '-1s' }
  );
  let expiredCode = null;
  try {
    await axios.get(`${SEC_URL}/status`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
  } catch (err) {
    expiredCode = err.response?.status;
  }
  assert(expiredCode === 401, 'Expired JWT rejected with HTTP 401');

  // -------------------------------------------------------------
  // 2. GET /status & Authoritative Score Integrity
  // -------------------------------------------------------------
  console.log('\n--- 2. GET /status & Deterministic Score Integrity ---');
  const statusRes = await axios.get(`${SEC_URL}/status`, { headers: adminHeaders });
  assert(typeof statusRes.data.score === 'number' || statusRes.data.score === null, 'Score is numeric or null');
  assert(typeof statusRes.data.status === 'string', `Status returned: ${statusRes.data.status}`);
  assert(Boolean(statusRes.data.freshness), 'Freshness metadata present in /status');
  assert(statusRes.data.freshness.ttlHours === 24, '24h TTL policy respected');

  // -------------------------------------------------------------
  // 3. GET /latest & Metadata Privacy
  // -------------------------------------------------------------
  console.log('\n--- 3. GET /latest & Metadata Sanitization ---');
  const latestRes = await axios.get(`${SEC_URL}/latest`, { headers: adminHeaders });
  assert(latestRes.status === 200, 'GET /latest returned HTTP 200');
  assert(Boolean(latestRes.data.audit?.id), `Audit ID verified: ${latestRes.data.audit?.id}`);
  assert(latestRes.data.audit.total_checks >= 24, `Total checks verified: ${latestRes.data.audit.total_checks}`);
  
  const latestAuditStr = JSON.stringify(latestRes.data);
  assert(!latestAuditStr.includes('password') && !latestAuditStr.includes('jwt_secret'), 'Zero secrets exposed in latest audit metadata');

  // -------------------------------------------------------------
  // 4. GET /audits & Pagination Validation
  // -------------------------------------------------------------
  console.log('\n--- 4. GET /audits & Pagination Controls ---');
  const auditsRes = await axios.get(`${SEC_URL}/audits?page=1&limit=5`, { headers: adminHeaders });
  assert(auditsRes.status === 200, 'GET /audits returned HTTP 200');
  assert(Array.isArray(auditsRes.data.audits), 'Audits array returned');
  assert(auditsRes.data.limit === 5, `Requested limit respected: ${auditsRes.data.limit}`);
  assert(typeof auditsRes.data.total === 'number', `Total count returned: ${auditsRes.data.total}`);

  // Test Max Page Size Clamping
  const hugeAuditsRes = await axios.get(`${SEC_URL}/audits?page=1&limit=500`, { headers: adminHeaders });
  assert(hugeAuditsRes.data.limit <= 50, `Huge limit clamped to maximum (Received: ${hugeAuditsRes.data.limit})`);

  // -------------------------------------------------------------
  // 5. GET /audits/:id Details & Checks Breakdown
  // -------------------------------------------------------------
  console.log('\n--- 5. GET /audits/:id Parameterized Lookups ---');
  const latestAuditId = latestRes.data.audit.id;
  const singleAuditRes = await axios.get(`${SEC_URL}/audits/${latestAuditId}`, { headers: adminHeaders });
  assert(singleAuditRes.status === 200, 'GET /audits/:id returned HTTP 200');
  assert(singleAuditRes.data.audit.id === latestAuditId, 'Audit ID matches requested resource');
  assert(Array.isArray(singleAuditRes.data.checks), 'Itemized checks array returned');
  assert(Boolean(singleAuditRes.data.score_breakdown), 'Score breakdown object attached');

  // Nonexistent audit ID -> 404
  let notFoundCode = null;
  try {
    await axios.get(`${SEC_URL}/audits/nonexistent-audit-999`, { headers: adminHeaders });
  } catch (err) {
    notFoundCode = err.response?.status;
  }
  assert(notFoundCode === 404, 'Nonexistent audit ID returned HTTP 404');

  // Malformed / SQLi audit ID -> 400
  let sqliCode = null;
  try {
    await axios.get(`${SEC_URL}/audits/' OR '1'='1`, { headers: adminHeaders });
  } catch (err) {
    sqliCode = err.response?.status;
  }
  assert(sqliCode === 400, 'SQL injection attempt in audit ID rejected with HTTP 400');

  // -------------------------------------------------------------
  // 6. GET /checks & Allow-Listed Filtering
  // -------------------------------------------------------------
  console.log('\n--- 6. GET /checks & Filter Allow-Lists ---');
  const checksRes = await axios.get(`${SEC_URL}/checks?severity=CRITICAL&page=1&limit=10`, { headers: adminHeaders });
  assert(checksRes.status === 200, 'GET /checks with severity filter returned HTTP 200');
  assert(Array.isArray(checksRes.data.checks), 'Filtered checks returned array');

  // Invalid severity -> 400
  let badSevCode = null;
  try {
    await axios.get(`${SEC_URL}/checks?severity=INVALID_SEVERITY_LEVEL`, { headers: adminHeaders });
  } catch (err) {
    badSevCode = err.response?.status;
  }
  assert(badSevCode === 400, 'Invalid severity filter rejected with HTTP 400');

  // Invalid status -> 400
  let badStatusCode = null;
  try {
    await axios.get(`${SEC_URL}/checks?status=HACKED_STATUS`, { headers: adminHeaders });
  } catch (err) {
    badStatusCode = err.response?.status;
  }
  assert(badStatusCode === 400, 'Invalid status filter rejected with HTTP 400');

  // -------------------------------------------------------------
  // 7. GET /events & Telemetry Privacy Verification
  // -------------------------------------------------------------
  console.log('\n--- 7. GET /events & Privacy Defense-in-Depth ---');
  const eventsRes = await axios.get(`${SEC_URL}/events?page=1&limit=20`, { headers: adminHeaders });
  assert(eventsRes.status === 200, 'GET /events returned HTTP 200');
  assert(Array.isArray(eventsRes.data.events), 'Events list returned');

  // Validate zero secrets across all returned event rows
  const eventsJsonStr = JSON.stringify(eventsRes.data.events);
  assert(!eventsJsonStr.includes('Password123!'), 'Zero plaintext passwords in /events response');
  assert(!eventsJsonStr.includes('eyJhbGci'), 'Zero raw JWT strings in /events response');

  // Invalid event_type filter -> 400
  let badEventTypeCode = null;
  try {
    await axios.get(`${SEC_URL}/events?event_type=INVALID_FORGED_TYPE`, { headers: adminHeaders });
  } catch (err) {
    badEventTypeCode = err.response?.status;
  }
  assert(badEventTypeCode === 400, 'Invalid event_type filter rejected with HTTP 400');

  // -------------------------------------------------------------
  // 8. GET /events/stats Aggregation
  // -------------------------------------------------------------
  console.log('\n--- 8. GET /events/stats Aggregated Metrics ---');
  const statsRes = await axios.get(`${SEC_URL}/events/stats`, { headers: adminHeaders });
  assert(statsRes.status === 200, 'GET /events/stats returned HTTP 200');
  assert(typeof statsRes.data.total === 'number', `Total events count: ${statsRes.data.total}`);
  assert(typeof statsRes.data.bySeverity === 'object', 'bySeverity breakdown returned');
  assert(typeof statsRes.data.byType === 'object', 'byType breakdown returned');
  assert(typeof statsRes.data.last24h === 'number', `Last 24h count: ${statsRes.data.last24h}`);

  // -------------------------------------------------------------
  // 9. GET /categories Authoritative Breakdown
  // -------------------------------------------------------------
  console.log('\n--- 9. GET /categories Scoring Breakdown ---');
  const catRes = await axios.get(`${SEC_URL}/categories`, { headers: adminHeaders });
  assert(catRes.status === 200, 'GET /categories returned HTTP 200');
  assert(catRes.data.scoring_policy.total_max_points === 100, 'Total max points is 100');
  assert(Object.keys(catRes.data.categories).length === 14, `All 14 categories present in breakdown`);
  assert(typeof catRes.data.overall_score === 'number', `Overall authoritative score returned: ${catRes.data.overall_score}`);

  // -------------------------------------------------------------
  // 10. GET /health Operational Health Checks
  // -------------------------------------------------------------
  console.log('\n--- 10. GET /health Subsystem Diagnostics ---');
  const healthRes = await axios.get(`${SEC_URL}/health`, { headers: adminHeaders });
  assert(healthRes.status === 200, 'GET /health returned HTTP 200');
  assert(healthRes.data.database === 'connected', 'Database connection verified');
  assert(healthRes.data.tables.security_audit_runs === true, 'security_audit_runs table verified');
  assert(healthRes.data.tables.security_checks === true, 'security_checks table verified');
  assert(healthRes.data.tables.security_events === true, 'security_events table verified');

  // -------------------------------------------------------------
  // 11. Read-Only Immutability Verification (No Mutation Endpoints)
  // -------------------------------------------------------------
  console.log('\n--- 11. Read-Only Immutability Gate ---');
  let postCode = null;
  let putCode = null;
  let deleteCode = null;

  try {
    await axios.post(`${SEC_URL}/audits`, { score: 100 }, { headers: adminHeaders });
  } catch (err) {
    postCode = err.response?.status;
  }
  try {
    await axios.put(`${SEC_URL}/audits/${latestAuditId}`, { status: 'HEALTHY' }, { headers: adminHeaders });
  } catch (err) {
    putCode = err.response?.status;
  }
  try {
    await axios.delete(`${SEC_URL}/audits/${latestAuditId}`, { headers: adminHeaders });
  } catch (err) {
    deleteCode = err.response?.status;
  }

  assert(postCode === 404 || postCode === 405, `POST on /audits denied (HTTP ${postCode})`);
  assert(putCode === 404 || putCode === 405, `PUT on /audits/:id denied (HTTP ${putCode})`);
  assert(deleteCode === 404 || deleteCode === 405, `DELETE on /audits/:id denied (HTTP ${deleteCode})`);

  // -------------------------------------------------------------
  // 12. Normal User Cross-Access Isolation (BOLA/IDOR Tests)
  // -------------------------------------------------------------
  console.log('\n--- 12. Complete BOLA / Normal User Route Isolation ---');
  const normalEndpoints = ['/status', '/latest', '/audits', '/checks', '/events', '/events/stats', '/categories', '/health'];
  let allBlocked = true;
  for (const ep of normalEndpoints) {
    try {
      const res = await axios.get(`${SEC_URL}${ep}`, { headers: normalHeaders });
      if (res.status === 200) allBlocked = false;
    } catch (err) {
      if (err.response?.status !== 403) allBlocked = false;
    }
  }
  assert(allBlocked, 'All Security Center endpoints strictly return HTTP 403 to non-admin users');

  // Summary
  console.log('\n================================================================');
  console.log(`🎯 PHASE 5A VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('✅ PHASE 5A ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  } else {
    console.error('❌ PHASE 5A VERIFICATION FAILED');
    process.exit(1);
  }
}

runPhase5aVerification().catch(e => {
  console.error('[Phase 5A Verification Error]:', e);
  process.exit(1);
});
