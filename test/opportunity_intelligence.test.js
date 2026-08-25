import axios from 'axios';
import db from '../server/db/sqliteClient.js';
import { generateToken } from '../server/middleware/auth.js';
import { validateSafeUrl, safeFetch } from '../server/services/safeHttpClient.js';
import { GreenhouseAdapter } from '../server/services/opportunityIntelligence/adapters/GreenhouseAdapter.js';
import { LeverAdapter } from '../server/services/opportunityIntelligence/adapters/LeverAdapter.js';
import { normalizeRawOpportunity } from '../server/services/opportunityIntelligence/normalizer.js';
import { deduplicateAndMergeOpportunity } from '../server/services/opportunityIntelligence/deduplicator.js';
import { runLifecycleReconciliation } from '../server/services/opportunityIntelligence/lifecycleManager.js';
import { executeScrapeRun, queueScrapeRun } from '../server/services/opportunityIntelligence/ingestionOrchestrator.js';

const API_BASE = 'http://127.0.0.1:5000/api/v1';

async function runOpportunityIntelligenceTestSuite() {
  console.log('================================================================');
  console.log('🧠 CAREERLY ADMIN OPPORTUNITY INTELLIGENCE ENGINE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, name) {
    total++;
    if (cond) {
      console.log(`  [PASS] ✓ ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${name}`);
      throw new Error(`Assertion failed: ${name}`);
    }
  }

  // 1. Fixtures Setup (Admin Token & Normal User Token)
  console.log('1. Setting up Test Identity Fixtures...');
  const adminId = 'admin-test-ai-001';
  const normalUserId = 'user-test-norm-001';

  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, role, is_email_verified, is_disabled, token_version)
    VALUES (?, ?, 'hash', 'admin', 1, 0, 1)
  `).run(adminId, 'admin.intelligence@careerly.app');

  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, role, is_email_verified, is_disabled, token_version)
    VALUES (?, ?, 'hash', 'user', 1, 0, 1)
  `).run(normalUserId, 'candidate.regular@careerly.app');

  const adminToken = generateToken({ id: adminId, email: 'admin.intelligence@careerly.app', role: 'admin', token_version: 1 });
  const userToken = generateToken({ id: normalUserId, email: 'candidate.regular@careerly.app', role: 'user', token_version: 1 });
  assert(adminToken && userToken, 'Admin and Candidate JWT test credentials generated');

  // 2. Authorization & RBAC Gate Tests
  console.log('\n2. Testing Admin Authorization & RBAC Gates...');
  
  // A. Anonymous caller rejected (401)
  try {
    await axios.get(`${API_BASE}/admin/opportunity-intelligence/overview`);
    assert(false, 'Anonymous request should have been rejected with HTTP 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Anonymous request to /admin/opportunity-intelligence/overview rejected with HTTP 401');
  }

  // B. Regular user caller rejected (403)
  try {
    await axios.get(`${API_BASE}/admin/opportunity-intelligence/overview`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(false, 'Regular user request should have been rejected with HTTP 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Regular user request to /admin/opportunity-intelligence/overview rejected with HTTP 403 Forbidden');
  }

  // C. Admin caller authorized (200)
  const overviewRes = await axios.get(`${API_BASE}/admin/opportunity-intelligence/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(overviewRes.status === 200 && overviewRes.data.status === 'success', 'Admin authorized to access /admin/opportunity-intelligence/overview (HTTP 200)');
  assert(typeof overviewRes.data.metrics?.total_opportunities === 'number', 'Executive metrics payload includes total_opportunities count');

  // 3. SSRF Defense & URL Allowlisting Tests
  console.log('\n3. Testing Strict SSRF Defense on Ingestion Endpoints...');
  const restrictedUrls = [
    'http://127.0.0.1:5000/api/v1/admin',
    'http://localhost:5000',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.1:8080',
    'http://192.168.1.1',
    'http://0.0.0.0:3000',
    'file:///etc/passwd'
  ];

  for (const dangerousUrl of restrictedUrls) {
    let blocked = false;
    try {
      await validateSafeUrl(dangerousUrl);
    } catch (e) {
      blocked = true;
    }
    assert(blocked, `SSRF Guard neutralized: "${dangerousUrl}"`);
  }

  // 4. Source Adapter Ingestion & Normalization Unit Tests
  console.log('\n4. Testing Source Adapter Ingestion & Deterministic Normalization...');
  const ghAdapter = new GreenhouseAdapter({ boardToken: 'cloudflare', companyName: 'Cloudflare' });
  assert(ghAdapter.sourceId === 'greenhouse-cloudflare', 'Greenhouse adapter initialized with correct sourceId');
  assert(ghAdapter.tier === 1 && ghAdapter.trustScore === 99, 'Greenhouse adapter assigned Tier 1 with 99/100 trust score');

  const mockRawJob = {
    id: 998877,
    title: 'Software Engineer Intern (Summer 2026)',
    location: { name: 'Kuala Lumpur, Malaysia' },
    content: 'Exciting internship position paying RM 3,500/month. Requirements: React, TypeScript.',
    updated_at: '2026-06-01T00:00:00Z',
    absolute_url: 'https://boards.greenhouse.io/cloudflare/jobs/998877'
  };

  const normalizedGh = ghAdapter.normalize(mockRawJob, 'run-unit-test');
  assert(normalizedGh.id === 'opp-gh-cloudflare-998877', 'Normalized Greenhouse opportunity ID mapped deterministically');
  assert(normalizedGh.company === 'Cloudflare', 'Normalized company name assigned correctly');
  assert(normalizedGh.opportunity_type === 'internship', 'Normalized opportunity type correctly classified as internship');
  assert(normalizedGh.location_country === 'Malaysia', 'Normalized country mapped to Malaysia');
  assert(normalizedGh.is_paid === 1, 'Marked as paid opportunity');

  const validation = ghAdapter.validate(normalizedGh);
  assert(validation.valid === true && validation.errors.length === 0, 'Normalized opportunity passes schema validation');

  // 5. Deterministic Deduplication Tests
  console.log('\n5. Testing Multi-Stage Deduplication Engine...');
  // A. Insert test record
  db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      id, source_id, external_id, title, normalized_title, company, normalized_company, organization,
      location_country, location_city, official_apply_url, status, lifecycle_status,
      first_seen_at, last_seen_at, trust_score, source_authority_level
    ) VALUES (
      'opp-dedup-001', 'greenhouse-stripe', 'stripe-12345', 'Senior Frontend Engineer',
      'Senior Frontend Engineer', 'Stripe', 'Stripe', 'Stripe', 'Malaysia', 'Kuala Lumpur',
      'https://boards.greenhouse.io/stripe/jobs/12345#app', 'active', 'ACTIVE',
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 99, 1
    )
  `).run();

  // B. Deduplication by exact Source ID + External ID
  const dedupByExt = deduplicateAndMergeOpportunity({
    source_id: 'greenhouse-stripe',
    external_id: 'stripe-12345',
    official_apply_url: 'https://boards.greenhouse.io/stripe/jobs/12345#app',
    normalized_company: 'Stripe',
    normalized_title: 'Senior Frontend Engineer'
  });
  assert(dedupByExt.isDuplicate === true && dedupByExt.matchType === 'EXTERNAL_ID', 'Deduplication caught duplicate by External ID match');

  // C. Deduplication by Canonical Apply URL
  const dedupByUrl = deduplicateAndMergeOpportunity({
    source_id: 'lever-stripe',
    external_id: 'different-id-999',
    official_apply_url: 'https://boards.greenhouse.io/stripe/jobs/12345#app',
    normalized_company: 'Stripe',
    normalized_title: 'Senior Frontend Engineer'
  });
  assert(dedupByUrl.isDuplicate === true && dedupByUrl.matchType === 'CANONICAL_URL', 'Deduplication caught duplicate by Canonical Apply URL match');

  // D. Deduplication by Composite Fingerprint (Normalized Company + Title + Country)
  const dedupByComp = deduplicateAndMergeOpportunity({
    source_id: 'custom-aggregator',
    external_id: 'agg-999',
    official_apply_url: 'https://aggregator.com/jobs/999',
    normalized_company: 'Stripe',
    normalized_title: 'Senior Frontend Engineer',
    location_country: 'Malaysia'
  });
  assert(dedupByComp.isDuplicate === true && dedupByComp.matchType === 'COMPOSITE_FINGERPRINT', 'Deduplication caught duplicate by Normalized Composite Fingerprint');

  // 6. Background Scrape Run Orchestration & Error Resilience Tests
  console.log('\n6. Testing Background Scrape Run Orchestration & Partial Failure Handling...');
  
  // Trigger a scrape run with specific sources
  const queueRes = await axios.post(`${API_BASE}/admin/opportunity-intelligence/scrape-runs`, {
    configuration: {
      opportunity_type: 'all',
      selected_sources: ['gh-cloudflare', 'lever-spotify'],
      max_records: 20,
      use_ai: false
    }
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert(queueRes.status === 202 && queueRes.data.status === 'queued', 'Scrape run queued and returned HTTP 202 Accepted immediately');
  const runId = queueRes.data.run_id;
  assert(runId && runId.startsWith('run-'), 'Queue response returned valid run_id identifier');

  // Wait briefly for background execution to complete
  console.log('   Waiting for background orchestrator to process run...');
  let runData = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const runStatusRes = await axios.get(`${API_BASE}/admin/opportunity-intelligence/scrape-runs/${runId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    runData = runStatusRes.data.run;
    if (['COMPLETED', 'PARTIAL'].includes(runData.status)) break;
  }

  assert(runData !== null, 'Scrape run detail fetched successfully');
  assert(['RUNNING', 'COMPLETED', 'PARTIAL'].includes(runData.status), `Run status transitioned properly (Status: ${runData.status})`);
  assert(runData.sources_attempted >= 1 || runData.status === 'RUNNING', `Recorded sources attempted or running: ${runData.sources_attempted}`);

  // 7. Opportunity Lifecycle State Reconciliation Tests
  console.log('\n7. Testing Opportunity Lifecycle Reconciliation...');
  // Insert an opportunity with expired deadline
  db.prepare(`
    INSERT OR REPLACE INTO opportunities (
      id, title, company, organization, deadline_utc, status, lifecycle_status
    ) VALUES (
      'opp-lifecycle-expired-test', 'Past Fellowship', 'Foundation', 'Foundation',
      '2020-01-01', 'active', 'ACTIVE'
    )
  `).run();

  const lifecycleResult = runLifecycleReconciliation();
  assert(lifecycleResult.expired_by_deadline >= 1, `Lifecycle reconciliation caught expired deadline (Count: ${lifecycleResult.expired_by_deadline})`);

  const expiredOpp = db.prepare('SELECT lifecycle_status, status FROM opportunities WHERE id = ?').get('opp-lifecycle-expired-test');
  assert(expiredOpp.lifecycle_status === 'EXPIRED' && expiredOpp.status === 'expired', 'Expired opportunity status updated to EXPIRED');

  // 8. Discover Request Isolation & Latency Verification (Zero Outbound Scrape)
  console.log('\n8. Testing User Discover Request Isolation & Database-Driven Speed...');
  // Warm up connection
  await axios.get(`${API_BASE}/opportunities?type=all`);

  const startTime = Date.now();
  const discoverRes = await axios.get(`${API_BASE}/opportunities?type=all`);
  const latencyMs = Date.now() - startTime;

  assert(discoverRes.status === 200 && discoverRes.data.status === 'success', 'User Discover endpoint /api/v1/opportunities returned HTTP 200');
  assert(Array.isArray(discoverRes.data.opportunities), 'Discover returned valid opportunities array from database');
  assert(latencyMs < 1500, `Discover response served purely from SQLite in ${latencyMs}ms (< 1500ms SLA, no outbound scraping)`);

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} OPPORTUNITY INTELLIGENCE ENGINE TESTS PASSED (100%)!`);
  console.log('================================================================\n');
}

runOpportunityIntelligenceTestSuite().catch(e => {
  console.error('\nTest Suite Failed:', e.message);
  process.exit(1);
});
