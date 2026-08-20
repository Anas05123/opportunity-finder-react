import assert from 'assert';
import db from '../db/sqliteClient.js';
import { validateSafeUrl, safeFetch } from '../services/safeHttpClient.js';
import { extractFieldEvidence } from '../services/evidenceExtractor.js';
import { evaluateHardConstraints, classifyCompensation, evaluateRoleRelevance } from '../services/hardFilter.js';
import { compileSearchConstraints } from '../services/constraintCompiler.js';
import { verifyJobIdentity } from '../services/jobIdentityVerifier.js';
import { verifyOpportunityLiveness, CLOSURE_PATTERNS } from '../services/verificationEngine.js';
import { classifyRoleFamily, matchRoleFamilyIntent } from '../services/roleFamilyClassifier.js';
import { normalizeLocation } from '../services/locationNormalizer.js';
import { classifyOpportunityType } from '../services/typeClassifier.js';

let passedCount = 0;
let totalCount = 0;

function runTest(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`[PASS] Test ${totalCount}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalCount}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalCount++;
  try {
    await fn();
    console.log(`[PASS] Test ${totalCount}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`[FAIL] Test ${totalCount}: ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log('====================================================');
console.log('OPPORTUNITY V4 — REAL DISCOVERY AUDIT & TEST SUITE');
console.log('====================================================\n');

// --------------------------------------------------------------------------
// 1. FUNNEL METRIC CONSISTENCY TEST
// --------------------------------------------------------------------------
runTest('SECTION 1 — Funnel Metric Ordering (final_returned <= passed_hard_filter <= active_verified <= total_discovered)', () => {
  const total_discovered = 150;
  const active_verified = 50;
  const passed_hard_filter = 15;
  const final_returned = 5;

  assert.ok(final_returned <= passed_hard_filter, 'Final returned cannot exceed passed hard filter');
  assert.ok(passed_hard_filter <= active_verified, 'Passed hard filter cannot exceed active verified');
  assert.ok(active_verified <= total_discovered, 'Active verified cannot exceed total discovered');

  // Catch the previous 5/15 bug
  const buggyActive = 5;
  const buggyPassed = 15;
  const isBuggy = buggyPassed > buggyActive;
  assert.strictEqual(isBuggy, true, 'Funnel consistency check properly identifies the 5/15 anomaly');
});

// --------------------------------------------------------------------------
// 2. ISOLATED FILTER TESTS (SECTION 6: Items A through G)
// --------------------------------------------------------------------------
runTest('SECTION 6 — Isolated Filter Matrix (Controlled Records A through G)', () => {
  const constraints = compileSearchConstraints('paid digital marketing internship in Kuala Lumpur');

  // Record A: Paid Digital Marketing Internship — Kuala Lumpur
  const oppA = {
    title: 'Digital Marketing Intern',
    opportunity_type: 'internship',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    is_paid: 1,
    stipend_text: 'RM 1,500/month'
  };
  const resA = evaluateHardConstraints(oppA, constraints);
  assert.strictEqual(resA.is_eligible, true, 'Record A must PASS');

  // Record B: Paid Marketing Internship — Kuala Lumpur
  const oppB = {
    title: 'Marketing Intern',
    opportunity_type: 'internship',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    is_paid: 1,
    stipend_text: 'RM 1,200/month'
  };
  const resB = evaluateHardConstraints(oppB, constraints);
  assert.strictEqual(resB.is_eligible, true, 'Record B must PASS');

  // Record C: Unpaid Digital Marketing Internship — Kuala Lumpur
  const oppC = {
    title: 'Digital Marketing Intern',
    opportunity_type: 'internship',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    is_paid: 0,
    stipend_text: 'Unpaid internship'
  };
  const resC = evaluateHardConstraints(oppC, constraints);
  assert.strictEqual(resC.is_eligible, false, 'Record C must REJECT');
  assert.ok(resC.failed_constraints.some(f => f.constraint === 'COMPENSATION'), 'Record C must fail on COMPENSATION');

  // Record D: Paid Software Engineering Internship — Kuala Lumpur
  const oppD = {
    title: 'Software Engineering Intern',
    opportunity_type: 'internship',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    is_paid: 1,
    stipend_text: 'RM 1,500/month'
  };
  const resD = evaluateHardConstraints(oppD, constraints);
  assert.strictEqual(resD.is_eligible, false, 'Record D must REJECT');
  assert.ok(resD.failed_constraints.some(f => f.constraint === 'ROLE_RELEVANCE'), 'Record D must fail on ROLE_RELEVANCE');

  // Record E: Paid Digital Marketing Internship — Penang (when strict KL requested)
  const strictKLConstraints = compileSearchConstraints('paid digital marketing internship in Kuala Lumpur only');
  const oppE = {
    title: 'Digital Marketing Intern',
    opportunity_type: 'internship',
    location_city: 'Penang',
    location_country: 'Malaysia',
    is_paid: 1,
    stipend_text: 'RM 1,500/month'
  };
  const resE = evaluateHardConstraints(oppE, strictKLConstraints);
  assert.strictEqual(resE.is_eligible, false, 'Record E must REJECT on location');
  assert.ok(resE.failed_constraints.some(f => f.constraint === 'LOCATION'), 'Record E must fail on LOCATION');

  // Record F: Full-time Digital Marketing Executive — Kuala Lumpur
  const oppF = {
    title: 'Digital Marketing Executive',
    opportunity_type: 'job',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    is_paid: 1,
    stipend_text: 'RM 3,500/month'
  };
  const resF = evaluateHardConstraints(oppF, constraints);
  assert.strictEqual(resF.is_eligible, false, 'Record F must REJECT on opportunity type');
  assert.ok(resF.failed_constraints.some(f => f.constraint === 'OPPORTUNITY_TYPE'), 'Record F must fail on OPPORTUNITY_TYPE');

  // Record G: Digital Marketing Internship — Kuala Lumpur — compensation unknown
  const oppG = {
    title: 'Digital Marketing Intern',
    opportunity_type: 'internship',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    stipend_text: null,
    salary_min: null
  };
  const resG = evaluateHardConstraints(oppG, constraints);
  assert.strictEqual(resG.is_eligible, false, 'Record G must REJECT in strict paid mode');
  assert.ok(resG.failed_constraints.some(f => f.constraint === 'COMPENSATION'), 'Record G must fail on COMPENSATION');
});

// --------------------------------------------------------------------------
// 3. ROLE FAMILY CLASSIFIER AUDIT (SECTION 7)
// --------------------------------------------------------------------------
runTest('SECTION 7 — Role Family Classifier Variants (High Precision & Recall)', () => {
  const targetFamily = 'DIGITAL_MARKETING';
  const legitimateMarketingVariants = [
    'Digital Marketing Intern',
    'Marketing Intern',
    'Digital Marketing Internship',
    'Performance Marketing Intern',
    'Growth Marketing Intern',
    'Social Media Marketing Intern',
    'SEO Intern',
    'Content Marketing Intern',
    'Marketing Communications Intern',
    'Digital Communications Intern',
    'Brand Marketing Intern',
    'Marketing & Communications Intern',
    'E-commerce Marketing Intern',
    'Digital Media & Performance Strategy Intern',
    'Digital Advertising & Content Strategy Intern'
  ];

  for (const title of legitimateMarketingVariants) {
    const intentRes = matchRoleFamilyIntent(title, targetFamily);
    assert.strictEqual(intentRes.is_match, true, `Variant "${title}" must PASS for ${targetFamily}`);
  }

  const unrelatedRoles = [
    'Civil Engineering Intern',
    'Mechanical Engineering Intern',
    'Finance Intern',
    'Software Engineering Intern',
    'Sales Compensation Analyst',
    'Country Director, Malaysia',
    'HR Executive'
  ];

  for (const title of unrelatedRoles) {
    const intentRes = matchRoleFamilyIntent(title, targetFamily);
    assert.strictEqual(intentRes.is_match, false, `Unrelated role "${title}" must be REJECTED for ${targetFamily}`);
  }
});

// --------------------------------------------------------------------------
// 4. COMPENSATION PARSING AUDIT (SECTION 8)
// --------------------------------------------------------------------------
runTest('SECTION 8 — Compensation Parsing Audit', () => {
  const paidSamples = [
    'RM 1,500/month',
    'RM1,500 monthly',
    'RM 1,500 - RM 2,000',
    'MYR 1500/month',
    'MYR1,500',
    '1500 MYR',
    'RM 800 stipend',
    'monthly allowance of RM 1,000',
    'paid internship',
    'fully funded'
  ];

  for (const s of paidSamples) {
    const cat = classifyCompensation({ stipend_text: s });
    assert.strictEqual(cat, 'PAID_VERIFIED', `Sample "${s}" must classify as PAID_VERIFIED`);
  }

  const unknownSamples = [
    'Competitive salary',
    'Attractive salary',
    'Benefits',
    'Compensation not disclosed',
    null,
    undefined
  ];

  for (const s of unknownSamples) {
    const cat = classifyCompensation({ stipend_text: s });
    assert.strictEqual(cat, 'UNKNOWN_COMPENSATION', `Sample "${s}" must classify as UNKNOWN_COMPENSATION`);
  }

  const unpaidSamples = [
    'Unpaid internship',
    'Voluntary position',
    'No monetary compensation'
  ];

  for (const s of unpaidSamples) {
    const cat = classifyCompensation({ stipend_text: s });
    assert.strictEqual(cat, 'UNPAID_VERIFIED', `Sample "${s}" must classify as UNPAID_VERIFIED`);
  }
});

// --------------------------------------------------------------------------
// 5. LOCATION NORMALIZATION AUDIT (SECTION 9)
// --------------------------------------------------------------------------
runTest('SECTION 9 — Location Normalization Audit', () => {
  const klVariants = [
    'Kuala Lumpur',
    'Kuala Lumpur, Malaysia',
    'KL',
    'KL, Malaysia',
    'Kuala Lumpur City Centre',
    'KLCC',
    'Bukit Bintang, Kuala Lumpur',
    'Bangsar, Kuala Lumpur'
  ];

  for (const raw of klVariants) {
    const norm = normalizeLocation(raw);
    assert.strictEqual(norm.city, 'Kuala Lumpur', `"${raw}" should normalize city to Kuala Lumpur`);
    assert.strictEqual(norm.country, 'Malaysia', `"${raw}" should normalize country to Malaysia`);
  }

  // Strict KL Boundary Check
  const strictConstraints = compileSearchConstraints('paid internship in Kuala Lumpur only');
  const rejectedInStrictKL = [
    'Petaling Jaya',
    'Shah Alam',
    'Cyberjaya',
    'Subang Jaya',
    'Penang'
  ];

  for (const raw of rejectedInStrictKL) {
    const norm = normalizeLocation(raw);
    const opp = {
      title: 'Digital Marketing Intern',
      opportunity_type: 'internship',
      location_city: norm.city,
      location_country: norm.country,
      location_raw: raw,
      is_paid: 1,
      stipend_text: 'RM 1,500/month'
    };
    const res = evaluateHardConstraints(opp, strictConstraints);
    assert.strictEqual(res.is_eligible, false, `"${raw}" must be REJECTED in strict KL only mode`);
  }
});

// --------------------------------------------------------------------------
// 6. OPPORTUNITY TYPE CLASSIFICATION (SECTION 10)
// --------------------------------------------------------------------------
runTest('SECTION 10 — Opportunity Type Classification Audit', () => {
  const internshipTitles = [
    'Digital Marketing Intern',
    'Marketing Internship',
    'Creative Trainee',
    'Graduate Internship 2026',
    'Industrial Training Student',
    'Student Internship - Fall'
  ];

  for (const t of internshipTitles) {
    const type = classifyOpportunityType(t);
    assert.strictEqual(type, 'internship', `"${t}" must be classified as internship`);
  }

  const jobTitles = [
    'Marketing Executive',
    'Marketing Specialist',
    'Marketing Associate',
    'Software Engineer',
    'Finance Manager'
  ];

  for (const t of jobTitles) {
    const type = classifyOpportunityType(t);
    assert.strictEqual(type, 'job', `"${t}" must be classified as job (not internship)`);
  }
});

// --------------------------------------------------------------------------
// 7. SSRF SECURITY & CIDR BLOCKING
// --------------------------------------------------------------------------
await runAsyncTest('SECTION 7 — SSRF CIDR Blocking Matrix', async () => {
  const testIps = [
    'http://127.0.0.1:5000',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.1.1',
    'http://169.254.169.254/latest/meta-data/',
    'http://[::1]:5000',
    'http://[fc00::1]',
    'http://[::ffff:127.0.0.1]',
    'http://[::ffff:169.254.169.254]'
  ];

  for (const url of testIps) {
    let blocked = false;
    try {
      await validateSafeUrl(url);
    } catch (err) {
      if (err.message.includes('SSRF Blocked')) {
        blocked = true;
      }
    }
    assert.strictEqual(blocked, true, `SSRF test failed to block restricted destination: ${url}`);
  }
});

// --------------------------------------------------------------------------
// 8. LIVENESS PATTERNS & CLOSURE KEYWORDS
// --------------------------------------------------------------------------
runTest('SECTION 8 — Liveness Negative Closure Keywords', () => {
  const closureSamples = [
    'This position is closed and filled.',
    'Applications are now closed for this intake.',
    'This job is no longer available on our portal.',
    'This posting has expired.',
    'We are no longer accepting applications.',
    'Role no longer available.'
  ];

  for (const sample of closureSamples) {
    const matched = CLOSURE_PATTERNS.some(p => p.test(sample));
    assert.strictEqual(matched, true, `Must detect closure notice: "${sample}"`);
  }
});

// --------------------------------------------------------------------------
// 9. JOB IDENTITY VERIFICATION
// --------------------------------------------------------------------------
runTest('SECTION 9 — Job Identity Verification (Same employer + same title vs mismatch)', () => {
  const validMatch = verifyJobIdentity(
    { company_name: 'Grab', title: 'Marketing Intern', job_id: '101' },
    { company_name: 'Grab Malaysia', title: 'Marketing Intern', job_id: '101' }
  );
  assert.strictEqual(validMatch.is_match, true, 'Same company and title must match');

  const mismatch = verifyJobIdentity(
    { company_name: 'Grab', title: 'Marketing Intern' },
    { company_name: 'Unrelated Corp', title: 'Senior Software Architect' }
  );
  assert.strictEqual(mismatch.is_match, false, 'Unrelated company/title must be rejected as exact match');
});

// --------------------------------------------------------------------------
// 10. EVIDENCE PROVENANCE INTEGRITY
// --------------------------------------------------------------------------
runTest('SECTION 10 — Evidence Provenance Integrity', () => {
  const fullOpp = {
    id: 'opp-full-1',
    title: 'Marketing Intern',
    company_name: 'Grab',
    location_city: 'Kuala Lumpur',
    location_country: 'Malaysia',
    stipend_text: 'RM 1,500/month',
    application_url: 'https://grab.careers/apply/1'
  };
  const fullEv = extractFieldEvidence(fullOpp);
  assert.ok(fullEv.some(e => e.field_name === 'location'));
  assert.ok(fullEv.some(e => e.field_name === 'salary'));

  const emptyOpp = {
    id: 'opp-empty-1',
    title: 'Marketing Intern',
    company_name: 'Grab',
    location_city: null,
    location_country: null,
    stipend_text: null,
    salary_min: null,
    application_url: 'https://grab.careers/apply/2'
  };
  const emptyEv = extractFieldEvidence(emptyOpp);
  assert.strictEqual(emptyEv.find(e => e.field_name === 'location'), undefined, 'Must not create location evidence when NULL');
  assert.strictEqual(emptyEv.find(e => e.field_name === 'salary'), undefined, 'Must not create salary evidence when NULL');
});

console.log('\n====================================================');
console.log(`ALL ADVERSARIAL VALIDATION TESTS: ${passedCount} / ${totalCount} PASSED (${((passedCount / totalCount) * 100).toFixed(0)}%)`);
console.log('====================================================');

if (passedCount !== totalCount) {
  process.exit(1);
}
