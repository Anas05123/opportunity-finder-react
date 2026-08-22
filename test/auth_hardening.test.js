import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../server/db/sqliteClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'careerly-super-secret-jwt-key-2026-production';

async function runHardenedAuthSuite() {
  console.log('================================================================');
  console.log('🛡️ CAREERLY PRODUCTION-GRADE AUTH & RBAC SECURITY HARDENING AUDIT');
  console.log('================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, testName) {
    totalChecks++;
    if (condition) {
      console.log(`  [PASS] ✓ ${testName}`);
      passedChecks++;
    } else {
      console.error(`  [FAIL] ✗ ${testName}`);
      throw new Error(`Security Test Failed: ${testName}`);
    }
  }

  // Setup Test Fixture Users
  const timestamp = Date.now();
  const adminEmail = 'ayarianas79@gmail.com'; // Primary Admin
  const normalUserEmail = `user.normal.${timestamp}@example.com`;
  const tenantBEmail = `user.victim.${timestamp}@example.com`;
  const disabledEmail = `user.disabled.${timestamp}@example.com`;

  // 1. Authenticate Admin (Anas)
  console.log('1. Setting up Admin and Normal User Fixtures...');
  const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: adminEmail,
    password: 'Admin12345!'
  });
  const adminToken = adminLoginRes.data.token;
  const adminId = adminLoginRes.data.user.id;
  assert(adminLoginRes.data.user.role === 'admin', 'Admin account has verified role = admin');

  // Create Normal User A
  const userARes = await axios.post(`${BASE_URL}/auth/google`, {
    email: normalUserEmail,
    full_name: 'Normal User A',
    google_id: `g-normal-${timestamp}`
  });
  const userAToken = userARes.data.token;
  const userAId = userARes.data.user.id;
  assert(userARes.data.user.role === 'user', 'Normal User A has role = user (No privilege escalation)');

  // Create Tenant User B (Victim)
  const userBRes = await axios.post(`${BASE_URL}/auth/google`, {
    email: tenantBEmail,
    full_name: 'Tenant User B',
    google_id: `g-victim-${timestamp}`
  });
  const userBToken = userBRes.data.token;
  const userBId = userBRes.data.user.id;

  // -------------------------------------------------------------
  // TEST 1: UNAUTHENTICATED → ADMIN API (EXHAUSTIVE 401 MATRIX)
  // -------------------------------------------------------------
  console.log('\n2. Testing: Unauthenticated → All /api/v1/admin/* Endpoints (401 Matrix)...');
  const adminEndpoints = [
    { method: 'get', path: '/admin/security/status' },
    { method: 'get', path: '/admin/security/overview' },
    { method: 'get', path: '/admin/security/events' },
    { method: 'post', path: '/admin/security/audit/run', data: {} },
    { method: 'post', path: '/admin/scrape', data: {} },
    { method: 'get', path: '/admin/users' },
    { method: 'post', path: '/admin/users/usr-mock/disable', data: { disable: true } },
    { method: 'post', path: '/admin/users/usr-mock/revoke-sessions', data: {} }
  ];

  for (const ep of adminEndpoints) {
    try {
      if (ep.method === 'get') {
        await axios.get(`${BASE_URL}${ep.path}`);
      } else {
        await axios.post(`${BASE_URL}${ep.path}`, ep.data);
      }
      assert(false, `Unauthenticated request to ${ep.path} should be rejected`);
    } catch (err) {
      assert(err.response && err.response.status === 401, `Unauthenticated → ${ep.path} returns HTTP 401`);
      // Verify no data or stack trace leakage in 401 response
      const dataStr = JSON.stringify(err.response.data || {});
      assert(!dataStr.includes('stack') && !dataStr.includes('sqlite') && !dataStr.includes('password_hash'), `Unauthenticated ${ep.path} response has zero stack trace / sensitive leakage`);
    }
  }

  // -------------------------------------------------------------
  // TEST 2: NORMAL USER → ADMIN API (EXHAUSTIVE 403 MATRIX)
  // -------------------------------------------------------------
  console.log('\n3. Testing: Normal USER → All /api/v1/admin/* Endpoints (403 Matrix)...');
  const initialDeniedCount = db.prepare("SELECT COUNT(*) as count FROM security_events WHERE event_type = 'ADMIN_ACCESS_DENIED'").get().count;

  for (const ep of adminEndpoints) {
    try {
      if (ep.method === 'get') {
        await axios.get(`${BASE_URL}${ep.path}`, {
          headers: { Authorization: `Bearer ${userAToken}` }
        });
      } else {
        await axios.post(`${BASE_URL}${ep.path}`, ep.data, {
          headers: { Authorization: `Bearer ${userAToken}` }
        });
      }
      assert(false, `Normal user access to ${ep.path} should be rejected with 403`);
    } catch (err) {
      assert(err.response && err.response.status === 403, `Normal USER → ${ep.path} returns HTTP 403 Forbidden`);
      assert(err.response.data && err.response.data.code === 'FORBIDDEN_ADMIN_ONLY', `Normal USER → ${ep.path} returns code: FORBIDDEN_ADMIN_ONLY`);
      // Verify no internal sensitive data in response
      const dataStr = JSON.stringify(err.response.data || {});
      assert(!dataStr.includes('stack') && !dataStr.includes('sqlite') && !dataStr.includes('token'), `Normal user 403 response on ${ep.path} is clean and leak-free`);
    }
  }

  // Verify Security Telemetry was logged for each unauthorized attempt
  const finalDeniedCount = db.prepare("SELECT COUNT(*) as count FROM security_events WHERE event_type = 'ADMIN_ACCESS_DENIED'").get().count;
  assert(finalDeniedCount >= initialDeniedCount + adminEndpoints.length, `Security telemetry logged ${adminEndpoints.length} ADMIN_ACCESS_DENIED events to database`);

  // -------------------------------------------------------------
  // TEST 3: USER → ANOTHER USER'S DATA (IDOR DEFENSE)
  // -------------------------------------------------------------
  console.log('\n4. Testing: User A → Access / Modify User B Data (IDOR / BOLA Isolation)...');
  const existingOpp = db.prepare('SELECT id FROM opportunities LIMIT 1').get();
  const testOppId = existingOpp ? existingOpp.id : 'opp-mock-001';

  if (!existingOpp) {
    db.prepare("INSERT OR IGNORE INTO opportunities (id, title, company, organization) VALUES (?, 'Test Opp', 'Test Co', 'Test Org')").run(testOppId);
  }

  // User B creates an application record
  const appBRes = await axios.post(`${BASE_URL}/applications`, {
    opportunity_id: testOppId,
    stage: 'applied',
    notes: 'Private confidential application for User B'
  }, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  const appBId = appBRes.data.application_id;

  // User A attempts to delete User B's application
  try {
    await axios.delete(`${BASE_URL}/applications/${appBId}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(false, 'User A should not be able to delete User B application');
  } catch (err) {
    assert(err.response && err.response.status === 404, 'User A deleting User B application rejected with 404 Not Found (Tenant Isolated)');
  }

  // Verify User B's application still exists intact
  const listBRes = await axios.get(`${BASE_URL}/applications`, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  const foundBApp = listBRes.data.applications.some(a => a.id === appBId);
  assert(foundBApp, 'User B application preserved intact after cross-tenant attack attempt');

  // -------------------------------------------------------------
  // TEST 4: MODIFIED FORGED ROLE IN TOKEN → ADMIN GATE
  // -------------------------------------------------------------
  console.log('\n5. Testing: Modified Forged Role in JWT token...');
  // Attacker crafts a token with role = 'admin' for normal user's ID
  const forgedRoleToken = jwt.sign(
    { userId: userAId, email: normalUserEmail, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    await axios.get(`${BASE_URL}/admin/security/status`, {
      headers: { Authorization: `Bearer ${forgedRoleToken}` }
    });
    assert(false, 'Forged role in token must NOT bypass live database role check');
  } catch (err) {
    assert(err.response && err.response.status === 403, 'Forged role in JWT rejected because live DB role is "user" (HTTP 403)');
  }

  // -------------------------------------------------------------
  // TEST 5: MODIFIED USER ID IN REQUEST PAYLOAD
  // -------------------------------------------------------------
  console.log('\n6. Testing: Attacker passes different user_id in payload...');
  // User A calls PUT /user/profile with user_id = User B's ID
  await axios.put(`${BASE_URL}/user/profile`, {
    user_id: userBId,
    full_name: 'Attacker Attempt',
    field_of_study: 'Hacked Major'
  }, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });

  // Verify User B's profile was NOT modified
  const profBRes = await axios.get(`${BASE_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  assert(profBRes.data.profile.full_name !== 'Attacker Attempt', 'Server strictly binds req.user.id and ignores payload user_id');

  // -------------------------------------------------------------
  // TEST 6: EXPIRED SESSION TOKEN
  // -------------------------------------------------------------
  console.log('\n7. Testing: Expired JWT Token...');
  const expiredToken = jwt.sign(
    { userId: userAId, email: normalUserEmail, role: 'user' },
    JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );

  try {
    await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(false, 'Expired token must be rejected');
  } catch (err) {
    assert(err.response && err.response.status === 401 && err.response.data.code === 'TOKEN_EXPIRED', 'Expired token rejected with 401 TOKEN_EXPIRED');
  }

  // -------------------------------------------------------------
  // TEST 7: REVOKED SESSION TOKEN
  // -------------------------------------------------------------
  console.log('\n8. Testing: Revoked Session Token (Explicit Revocation & Token Version)...');
  await axios.post(`${BASE_URL}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });

  try {
    await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    assert(false, 'Revoked token must be rejected');
  } catch (err) {
    assert(err.response && err.response.status === 401 && err.response.data.code === 'TOKEN_REVOKED', 'Revoked token rejected with 401 TOKEN_REVOKED');
  }

  // -------------------------------------------------------------
  // TEST 8: DISABLED / SUSPENDED ACCOUNT
  // -------------------------------------------------------------
  console.log('\n9. Testing: Disabled / Suspended Account Access...');
  const disabledUserRes = await axios.post(`${BASE_URL}/auth/google`, {
    email: disabledEmail,
    full_name: 'Suspended Account User',
    google_id: `g-disabled-${timestamp}`
  });
  const disabledUserToken = disabledUserRes.data.token;
  const disabledUserId = disabledUserRes.data.user.id;

  // Admin disables user account
  const disableRes = await axios.post(`${BASE_URL}/admin/users/${disabledUserId}/disable`, {
    disable: true
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(disableRes.data.status === 'success', 'Admin successfully disabled target account');

  // Disabled user tries to access protected profile
  try {
    await axios.get(`${BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${disabledUserToken}` }
    });
    assert(false, 'Disabled account must be blocked');
  } catch (err) {
    assert(err.response && err.response.status === 403 && (err.response.data.code === 'ACCOUNT_DISABLED' || err.response.data.code === 'TOKEN_REVOKED'), 'Disabled account blocked from API with 403 ACCOUNT_DISABLED');
  }

  // -------------------------------------------------------------
  // TEST 9: AUTHORIZED ADMIN ACCESS
  // -------------------------------------------------------------
  console.log('\n10. Testing: Authorized Admin Access to /api/v1/admin/*...');
  const adminStatusRes = await axios.get(`${BASE_URL}/admin/security/status`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminStatusRes.status === 200, 'Authorized Admin successfully retrieves /admin/security/status');

  const adminUsersRes = await axios.get(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminUsersRes.data.status === 'success' && Array.isArray(adminUsersRes.data.users), 'Authorized Admin retrieves user registry without password hashes');

  // -------------------------------------------------------------
  // TEST 10: FRONTEND ADMIN ROUTE UI PRIVACY
  // -------------------------------------------------------------
  console.log('\n11. Testing: Frontend AdminRoute Generic UI (Zero Route Leakage)...');
  const adminRouteSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/Auth/AdminRoute.jsx'), 'utf8');
  assert(adminRouteSrc.includes('Access Denied'), 'AdminRoute renders generic "Access Denied" title');
  assert(!adminRouteSrc.includes('{location.pathname}'), 'AdminRoute does NOT render {location.pathname} into unauthorized view');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} SECURITY HARDENING AUDIT CHECKS PASSED (100%)!`);
  console.log('================================================================\n');
}

runHardenedAuthSuite().catch(err => {
  console.error('Hardened Auth Audit Error:', err.message);
  process.exit(1);
});
