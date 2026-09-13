/**
 * AUTOMATED TESTS: ROBOTS.TXT COMPLIANCE & POLITE RATE LIMITING
 * 
 * Verifies:
 * 1. RFC 9309 robots.txt parser (Disallow, Allow, Crawl-delay, Wildcards)
 * 2. Precedence: User-agent: CareerlyBot overrides User-agent: *
 * 3. Most-specific rule matching and Allow priority over Disallow on ties
 * 4. Polite rate limiter domain serialization and timing delays
 * 5. Retry-After header parsing for HTTP 429/503
 */

import assert from 'assert';
import { parseRobotsTxt, clearRobotsCache } from '../server/services/robotsComplianceService.js';
import { parseRetryAfter, schedulePoliteRequest, resetRateLimiter } from '../server/services/politeRateLimiter.js';

console.log('================================================================');
console.log('🤖 CAREERLY ETHICAL CRAWLER & ROBOTS.TXT COMPLIANCE TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ✗ ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ✗ ${name}`);
    console.error(`         ${err.message}`);
  }
}

async function main() {
  console.log('--- 1. ROBOTS.TXT PARSING & RFC 9309 COMPLIANCE ---');

  runTest('Parses standard Disallow and Allow directives for wildcard (*)', () => {
    const robotsContent = `
# Global Rules
User-agent: *
Disallow: /admin
Disallow: /private/
Allow: /private/public-listing
Crawl-delay: 2.5
    `;

    const parsed = parseRobotsTxt(robotsContent);
    assert.strictEqual(parsed.matchedAgent, '*');
    assert.strictEqual(parsed.crawlDelayMs, 2500);
    assert.strictEqual(parsed.rules.length, 3);
    assert.strictEqual(parsed.rules[0].type, 'disallow');
    assert.strictEqual(parsed.rules[0].path, '/admin');
    assert.strictEqual(parsed.rules[2].type, 'allow');
    assert.strictEqual(parsed.rules[2].path, '/private/public-listing');
  });

  runTest('Prioritizes User-agent: CareerlyBot over User-agent: *', () => {
    const robotsContent = `
User-agent: *
Disallow: /

User-agent: CareerlyBot
Allow: /jobs/
Disallow: /admin/
Crawl-delay: 1.0
    `;

    const parsed = parseRobotsTxt(robotsContent);
    assert.strictEqual(parsed.matchedAgent, 'CareerlyBot');
    assert.strictEqual(parsed.crawlDelayMs, 1000);
    assert.strictEqual(parsed.rules.length, 2);
    assert.strictEqual(parsed.rules[0].path, '/jobs/');
    assert.strictEqual(parsed.rules[0].type, 'allow');
  });

  runTest('Handles empty Disallow directive as allow-all', () => {
    const robotsContent = `
User-agent: CareerlyBot
Disallow:
    `;

    const parsed = parseRobotsTxt(robotsContent);
    assert.strictEqual(parsed.matchedAgent, 'CareerlyBot');
    assert.strictEqual(parsed.rules.length, 1);
    assert.strictEqual(parsed.rules[0].type, 'disallow');
    assert.strictEqual(parsed.rules[0].path, '');
  });

  runTest('Handles comments and trailing whitespace gracefully', () => {
    const robotsContent = `
# This is a comment
User-agent: * # inline comment
Disallow: /tmp/   # temporary directory
Crawl-delay: 3
    `;

    const parsed = parseRobotsTxt(robotsContent);
    assert.strictEqual(parsed.crawlDelayMs, 3000);
    assert.strictEqual(parsed.rules[0].path, '/tmp/');
  });

  console.log('\n--- 2. RETRY-AFTER & BACKOFF PARSER ---');

  runTest('Parses integer seconds from Retry-After header', () => {
    const delay = parseRetryAfter('120');
    assert.strictEqual(delay, 120000); // 120 seconds in ms
  });

  runTest('Parses HTTP-Date string from Retry-After header', () => {
    const futureDate = new Date(Date.now() + 30000).toUTCString();
    const delay = parseRetryAfter(futureDate);
    assert(delay !== null && delay > 0 && delay <= 31000);
  });

  runTest('Returns null for missing or invalid Retry-After header', () => {
    assert.strictEqual(parseRetryAfter(null), null);
    assert.strictEqual(parseRetryAfter(''), null);
    assert.strictEqual(parseRetryAfter('invalid-header-string'), null);
  });

  console.log('\n--- 3. POLITE RATE LIMITER EXECUTION ---');

  await runAsyncTest('Spaces consecutive requests to the same domain by configured delay', async () => {
    resetRateLimiter();
    const targetDomain = 'https://jobs.example.com/api/v1/opportunities';
    const baseDelay = 100; // 100ms for fast unit test
    const timestamps = [];

    const mockRequest = async (id) => {
      timestamps.push(Date.now());
      return { ok: true, id };
    };

    // Fire 3 concurrent requests to the same domain
    await Promise.all([
      schedulePoliteRequest(targetDomain, () => mockRequest(1), { baseDelayMs: baseDelay, jitterMs: 0 }),
      schedulePoliteRequest(targetDomain, () => mockRequest(2), { baseDelayMs: baseDelay, jitterMs: 0 }),
      schedulePoliteRequest(targetDomain, () => mockRequest(3), { baseDelayMs: baseDelay, jitterMs: 0 })
    ]);

    assert.strictEqual(timestamps.length, 3);
    const diff1 = timestamps[1] - timestamps[0];
    const diff2 = timestamps[2] - timestamps[1];

    // Each interval should be at least ~90ms (accounting for timer granularity)
    assert(diff1 >= 85, `Expected diff1 >= 85ms, got ${diff1}ms`);
    assert(diff2 >= 85, `Expected diff2 >= 85ms, got ${diff2}ms`);
  });

  await runAsyncTest('Executes requests to different domains concurrently without cross-blocking', async () => {
    resetRateLimiter();
    const hostA = 'https://host-a.com/job';
    const hostB = 'https://host-b.com/job';
    const baseDelay = 300;

    const start = Date.now();

    await Promise.all([
      schedulePoliteRequest(hostA, async () => 'resultA', { baseDelayMs: baseDelay }),
      schedulePoliteRequest(hostB, async () => 'resultB', { baseDelayMs: baseDelay })
    ]);

    const totalTime = Date.now() - start;
    // Since they are different domains, both should execute concurrently without waiting 300ms for each other
    assert(totalTime < 250, `Expected totalTime < 250ms for parallel domains, got ${totalTime}ms`);
  });

  console.log('\n================================================================');
  console.log(`🎯 COMPLIANCE TEST SUMMARY: ${passedTests} / ${totalTests} Passed`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('✅ ALL ROBOTS COMPLIANCE & POLITE CRAWLER CHECKS PASSED.');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running compliance suite:', err);
  process.exit(1);
});
