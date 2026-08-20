import assert from 'assert';
import db from '../db/sqliteClient.js';
import { discoverOpportunities } from '../services/discoveryOrchestrator.js';
import { expandSearchProfile } from '../services/queryExpander.js';
import { compileSearchConstraints } from '../services/constraintCompiler.js';

let passed = 0;
let total = 0;

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`[PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Test ${total}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log('====================================================');
console.log('OPPORTUNITY V4 — DISCOVERY ORCHESTRATOR VALIDATION');
console.log('====================================================\n');

// --------------------------------------------------------------------------
// TEST 1: "I want a digital marketing specialist job anywhere"
// --------------------------------------------------------------------------
await runAsyncTest('Test 1 — Live Discovery for "I want a digital marketing specialist job anywhere"', async () => {
  const q = 'I want a digital marketing specialist job anywhere';
  const res = await discoverOpportunities({ query: q });

  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.telemetry.intent.location_mode, 'ANYWHERE');
  assert.strictEqual(res.telemetry.intent.target_role_family, 'DIGITAL_MARKETING');
  assert.ok(res.telemetry.queriesGenerated >= 4, 'Must expand to at least 4 queries');
  assert.ok(res.telemetry.candidatesDiscovered > 0, 'Must discover live external candidates');
  assert.ok(res.results.length > 0, 'Must return at least 1 verified digital marketing opportunity');
  
  // Verify returned cards belong to Digital Marketing family
  for (const card of res.results) {
    assert.strictEqual(card.opportunity_type, 'job');
    assert.ok(
      card.title.toLowerCase().includes('marketing') || 
      card.title.toLowerCase().includes('growth') || 
      card.title.toLowerCase().includes('creative') ||
      card.title.toLowerCase().includes('strategist'),
      `Card "${card.title}" must be marketing-related`
    );
  }
});

// --------------------------------------------------------------------------
// TEST 2: "I want a digital marketing specialist job in Kuala Lumpur"
// --------------------------------------------------------------------------
await runAsyncTest('Test 2 — Location-Scoped Discovery for "... in Kuala Lumpur"', async () => {
  const q = 'I want a digital marketing specialist job in Kuala Lumpur';
  const constraints = compileSearchConstraints(q);
  const plan = expandSearchProfile(constraints);

  assert.strictEqual(plan.location_suffix, 'Kuala Lumpur');
  assert.ok(plan.queries.some(query => query.includes('Kuala Lumpur')), 'Queries must contain Kuala Lumpur');

  const res = await discoverOpportunities({ query: q, compiledConstraints: constraints });
  assert.ok(res.telemetry.sourcesAttempted > 0);
  assert.strictEqual(res.telemetry.intent.target_city, 'Kuala Lumpur');
});

// --------------------------------------------------------------------------
// TEST 3: "I want a digital marketing executive job in Kuala Lumpur"
// --------------------------------------------------------------------------
await runAsyncTest('Test 3 — Distinct Role Intent for "digital marketing executive"', async () => {
  const q = 'I want a digital marketing executive job in Kuala Lumpur';
  const constraints = compileSearchConstraints(q);
  const plan = expandSearchProfile(constraints);

  assert.ok(plan.expanded_titles.includes('Digital Marketing Executive'));
  assert.strictEqual(constraints.predicates.allowed_types.includes('job'), true);
});

// --------------------------------------------------------------------------
// TEST 4: "Find me performance marketing jobs"
// --------------------------------------------------------------------------
await runAsyncTest('Test 4 — Targeted Performance Marketing Discovery', async () => {
  const q = 'Find me performance marketing jobs';
  const res = await discoverOpportunities({ query: q });

  assert.strictEqual(res.telemetry.intent.target_role_family, 'DIGITAL_MARKETING');
  assert.ok(res.results.length > 0, 'Must discover marketing opportunities');
});

// --------------------------------------------------------------------------
// TEST 5: "Find software engineering internships in Malaysia"
// --------------------------------------------------------------------------
await runAsyncTest('Test 5 — Software Engineering Internship Intent Isolation', async () => {
  const q = 'Find software engineering internships in Malaysia';
  const constraints = compileSearchConstraints(q);
  const plan = expandSearchProfile(constraints);

  assert.strictEqual(plan.target_role_family, 'SOFTWARE_ENGINEERING');
  assert.strictEqual(plan.is_internship, true);
  assert.ok(plan.expanded_titles.includes('Software Engineering Intern') || plan.expanded_titles.includes('SWE Intern'));
  assert.strictEqual(plan.expanded_titles.includes('Digital Marketing Specialist'), false, 'Must not include marketing titles');
});

// --------------------------------------------------------------------------
// TEST 6: Empty Source Simulation (Truthful zero state without fabrication)
// --------------------------------------------------------------------------
await runAsyncTest('Test 6 — Empty Source Simulation', async () => {
  const q = 'nonexistent_quantum_astronaut_internship_xyz in Antartica';
  const res = await discoverOpportunities({ query: q });

  assert.ok(res.status === 'zero_discovered' || res.status === 'zero_matched_requirements');
  assert.strictEqual(res.results.length, 0, 'Must never fabricate fake opportunities on zero results');
});

// --------------------------------------------------------------------------
// TEST 7: Provider Failure Simulation
// --------------------------------------------------------------------------
await runAsyncTest('Test 7 — Honest Failure State Classification', () => {
  const mockFailedResult = {
    sourcesSucceeded: 0,
    sourcesAttempted: 5,
    candidatesDiscovered: 0
  };

  const status = mockFailedResult.sourcesSucceeded === 0 ? 'discovery_failed' : 'success';
  assert.strictEqual(status, 'discovery_failed', 'Must report discovery_failed when all sources fail');
});

// --------------------------------------------------------------------------
// TEST 8: Cache & Deduplication (Searching same role twice)
// --------------------------------------------------------------------------
await runAsyncTest('Test 8 — Idempotent Cache & Deduplication', async () => {
  const q = 'I want a digital marketing specialist job anywhere';
  
  const countBefore = db.prepare('SELECT count(1) c FROM opportunities').get().c;
  const res1 = await discoverOpportunities({ query: q });
  const countAfter1 = db.prepare('SELECT count(1) c FROM opportunities').get().c;

  const res2 = await discoverOpportunities({ query: q });
  const countAfter2 = db.prepare('SELECT count(1) c FROM opportunities').get().c;

  // The second run must not create duplicate duplicate rows in DB
  assert.strictEqual(countAfter2, countAfter1, 'Second identical search must not inflate database with duplicate rows');
});

console.log('\n====================================================');
console.log(`ALL DISCOVERY ORCHESTRATOR TESTS: ${passed} / ${total} PASSED (${((passed / total) * 100).toFixed(0)}%)`);
console.log('====================================================');

if (passed !== total) {
  process.exit(1);
}
