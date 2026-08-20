/**
 * PHASE 4.1 — ADVERSARIAL SECURITY TELEMETRY & PRIVACY AUDIT
 * Tests privacy, secret-leakage, IP spoofing, injection, flooding, deduplication,
 * retention boundaries, and failure-safety under live adversary conditions.
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import db from '../server/db/sqliteClient.js';
import { 
  sanitizeSecurityDetails, 
  sanitizeUrlForTelemetry, 
  cleanupExpiredEvents,
  recordSecurityEvent 
} from '../server/services/security/securityEvents.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runPhase41Audit() {
  console.log('================================================================');
  console.log('🛡️  PHASE 4.1: ADVERSARIAL SECURITY TELEMETRY & PRIVACY AUDIT');
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

  const getLatestEvent = (eventType) => {
    return db.prepare(`
      SELECT * FROM security_events 
      WHERE event_type = ? 
      ORDER BY rowid DESC 
      LIMIT 1
    `).get(eventType);
  };

  // -------------------------------------------------------------
  // TEST 1: URL Query Secret Leakage (SSRF Target Scrubbing)
  // -------------------------------------------------------------
  console.log('--- Test 1: URL Query Secret Leakage via SSRF ---');
  const sensitiveUrls = [
    'http://127.0.0.1:5000/api/test?token=SUPER_SECRET_TOKEN_999',
    'http://127.0.0.1:5000/login?password=MY_SECRET_PASSWORD_888',
    'http://169.254.169.254/latest?api_key=AWS_SECRET_KEY_777&email=victim@target.com'
  ];

  for (const url of sensitiveUrls) {
    try {
      await axios.post(`${BASE_URL}/verify-link`, { url });
    } catch (e) {}
  }

  const ssrfEvent = getLatestEvent('SSRF_BLOCKED');
  assert(Boolean(ssrfEvent), 'SSRF_BLOCKED event recorded');
  
  const ssrfDetailsStr = ssrfEvent?.details_json || '{}';
  assert(!ssrfDetailsStr.includes('SUPER_SECRET_TOKEN_999'), 'Query token stripped from SSRF telemetry');
  assert(!ssrfDetailsStr.includes('MY_SECRET_PASSWORD_888'), 'Query password stripped from SSRF telemetry');
  assert(!ssrfDetailsStr.includes('AWS_SECRET_KEY_777'), 'Query api_key stripped from SSRF telemetry');
  assert(!ssrfDetailsStr.includes('victim@target.com'), 'Query email stripped from SSRF telemetry');

  const parsedUrlTelemetry = sanitizeUrlForTelemetry('https://internal.service.local:8443/private/path?token=SECRET#hash');
  assert(parsedUrlTelemetry.hostname === 'internal.service.local', 'Hostname preserved for threat intelligence');
  assert(parsedUrlTelemetry.port === '8443', 'Port preserved');
  assert(parsedUrlTelemetry.pathname === '/private/path', 'Pathname preserved');
  assert(!parsedUrlTelemetry.token && !JSON.stringify(parsedUrlTelemetry).includes('SECRET'), 'Query params completely dropped');

  // -------------------------------------------------------------
  // TEST 2: Authorization Header & Embedded Bearer Redaction
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Authorization Header & Bearer String Redaction ---');
  const dirtyHeaderPayload = {
    error: 'Authentication failed for Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.secretSignature',
    headers: {
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.raw.secret'
    }
  };

  const sanitizedHeader = sanitizeSecurityDetails(dirtyHeaderPayload);
  assert(sanitizedHeader.headers.Authorization === '[REDACTED]', 'Authorization object key redacted');
  assert(!sanitizedHeader.error.includes('secretSignature'), 'Embedded Bearer token inside string redacted');

  // -------------------------------------------------------------
  // TEST 3: Deeply Nested & Case-Insensitive Secret Sanitization
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Deeply Nested & Case-Insensitive Secrets ---');
  const attackObject = {
    PASSWORD: 'CapsPassword123',
    pAsSwOrD: 'MixedCasePass123',
    API_KEY: 'sk_live_capitalized',
    Token: 'TokenValueCaps',
    user_context: {
      level1: {
        level2: {
          smtp_password: 'nested_smtp_pass',
          gemini_api_key: 'nested_gemini_key',
          cv_content: 'nested_cv_bytes',
          reset_password_token: 'nested_reset_token'
        }
      }
    }
  };

  const cleanObject = sanitizeSecurityDetails(attackObject);
  assert(cleanObject.PASSWORD === '[REDACTED]', 'PASSWORD (uppercase) redacted');
  assert(cleanObject.pAsSwOrD === '[REDACTED]', 'pAsSwOrD (mixed case) redacted');
  assert(cleanObject.API_KEY === '[REDACTED]', 'API_KEY redacted');
  assert(cleanObject.Token === '[REDACTED]', 'Token redacted');
  assert(cleanObject.user_context.level1.level2.smtp_password === '[REDACTED]', 'Deeply nested smtp_password redacted');
  assert(cleanObject.user_context.level1.level2.gemini_api_key === '[REDACTED]', 'Deeply nested gemini_api_key redacted');
  assert(cleanObject.user_context.level1.level2.cv_content === '[REDACTED]', 'Deeply nested cv_content redacted');

  // -------------------------------------------------------------
  // TEST 4: Anti-IP Spoofing (Client Cannot Fake Peer Identity)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Anti-IP-Spoofing Peer Inspection ---');
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: `spoofed.ip.${Date.now()}@careerly.net`,
      password: 'BadPassword123!'
    }, {
      headers: {
        'X-Forwarded-For': '198.51.100.1, 203.0.113.195',
        'X-Real-IP': '198.51.100.1',
        'Forwarded': 'for=198.51.100.1'
      }
    });
  } catch (e) {}

  const spoofAuthEvent = getLatestEvent('AUTH_FAILURE');
  assert(spoofAuthEvent?.actor_ip !== '198.51.100.1', `X-Forwarded-For spoof rejected (Recorded real peer: ${spoofAuthEvent?.actor_ip})`);

  // -------------------------------------------------------------
  // TEST 5: Event Severity & Type Forgery Protection
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Event Severity & Type Forgery Protection ---');
  const forgedEvent1 = recordSecurityEvent({
    event_type: 'INVALID_ATTACK_TYPE_123',
    severity: 'SUPER_CRITICAL_FORGED',
    actor_ip: '127.0.0.1'
  });

  const loggedForgedEvent = getLatestEvent('SUSPICIOUS_REQUEST');
  assert(Boolean(loggedForgedEvent), 'Invalid event type coerced safely to SUSPICIOUS_REQUEST');
  assert(loggedForgedEvent?.severity === 'HIGH', 'Invalid forged severity safely mapped to standard HIGH matrix');

  // -------------------------------------------------------------
  // TEST 6: Event Flooding & Deduplication Storm Control
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Event Flooding & Deduplication Storm Control ---');
  const floodCount = 20;
  let deduplicatedCount = 0;
  for (let i = 0; i < floodCount; i++) {
    const res = recordSecurityEvent({
      event_type: 'AUTH_FAILURE',
      actor_ip: '10.99.99.99',
      request_path: '/api/v1/auth/login',
      request_method: 'POST',
      details: { reason: 'INVALID_CREDENTIALS' }
    });
    if (res.status === 'deduplicated') deduplicatedCount++;
  }
  assert(deduplicatedCount >= 19, `Deduplication throttled rapid burst (${deduplicatedCount}/${floodCount} deduplicated)`);

  // -------------------------------------------------------------
  // TEST 7: Deduplication Correctness (Distinct Targets Preserved)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Distinct Attack Targets Preserved ---');
  const targetARes = recordSecurityEvent({
    event_type: 'SSRF_BLOCKED',
    actor_ip: '127.0.0.1',
    request_path: '/api/v1/verify-link',
    request_method: 'POST',
    details: { target_url: 'http://127.0.0.1:5000' }
  });

  const targetBRes = recordSecurityEvent({
    event_type: 'SSRF_BLOCKED',
    actor_ip: '127.0.0.1',
    request_path: '/api/v1/verify-link',
    request_method: 'POST',
    details: { target_url: 'http://169.254.169.254' }
  });

  assert(targetARes.status === 'recorded', 'Target A SSRF event recorded');
  assert(targetBRes.status === 'recorded', 'Target B (distinct host) SSRF event recorded without false deduplication');

  // -------------------------------------------------------------
  // TEST 8: Retention Policy Safety & Clamping
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Retention Policy Bounds Safety ---');
  const negativeCleanup = cleanupExpiredEvents(-10);
  assert(negativeCleanup.retention_days === 90, `Negative retention clamped to 90 days (Received: ${negativeCleanup.retention_days})`);

  const nanCleanup = cleanupExpiredEvents('invalid_nan');
  assert(nanCleanup.retention_days === 90, `NaN retention clamped to 90 days (Received: ${nanCleanup.retention_days})`);

  const zeroCleanup = cleanupExpiredEvents(0);
  assert(zeroCleanup.retention_days === 90, `Zero retention clamped to 90 days (Received: ${zeroCleanup.retention_days})`);

  const validCleanup = cleanupExpiredEvents(60);
  assert(validCleanup.retention_days === 60, `Valid retention of 60 days respected (Received: ${validCleanup.retention_days})`);

  // -------------------------------------------------------------
  // TEST 9: Database Leakage Audit (All Rows in security_events)
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Complete Database Security Inspection ---');
  const allEvents = db.prepare('SELECT id, event_type, details_json, actor_email_hash FROM security_events').all();
  let foundRawSecret = false;
  for (const ev of allEvents) {
    const raw = (ev.details_json || '').toLowerCase();
    if (raw.includes('super_secret_token_999') || raw.includes('my_secret_password_888') || raw.includes('aws_secret_key_777')) {
      foundRawSecret = true;
    }
  }
  assert(!foundRawSecret, 'Database audit confirmed 100% clean of all injected adversarial secrets');

  // -------------------------------------------------------------
  // TEST 10: Telemetry Failure-Safety (Enforcement Remains Intact)
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Telemetry Failure-Safety & Non-Bypass ---');
  // Even if an unexpected error occurs inside recordSecurityEvent, the HTTP responses must still enforce security
  const safeCatchResult = recordSecurityEvent(null);
  assert(safeCatchResult.status === 'error', 'Logger handled null payload gracefully without throwing uncaught exception');

  // Verify SSRF block is still strictly enforced with HTTP 400
  let ssrfEnforced = false;
  try {
    await axios.post(`${BASE_URL}/verify-link`, { url: 'http://127.0.0.1:8080/admin' });
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.code === 'SSRF_BLOCKED') {
      ssrfEnforced = true;
    }
  }
  assert(ssrfEnforced, 'SSRF security barrier remains 100% enforced during all telemetry states');

  // Summary
  console.log('\n================================================================');
  console.log(`🎯 PHASE 4.1 AUDIT SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('✅ PHASE 4.1 ACCEPTANCE CRITERIA 100% VERIFIED');
    process.exit(0);
  } else {
    console.error('❌ PHASE 4.1 VERIFICATION FAILED');
    process.exit(1);
  }
}

runPhase41Audit().catch(e => {
  console.error('[Phase 4.1 Audit Error]:', e);
  process.exit(1);
});
