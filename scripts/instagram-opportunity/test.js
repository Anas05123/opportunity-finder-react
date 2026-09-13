import fs from 'fs';
import path from 'path';
import { validateInstagramUrl, normalizeDate, classifyOpportunityType, parseOpportunity } from './parser.js';
import { fetchFromFixtureFile } from './fetcher.js';
import { runExtractor } from './scraper.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 INSTAGRAM OPPORTUNITY EXTRACTOR TEST SUITE');
  console.log('====================================================');

  // ----------------------------------------------------
  // TEST SUITE 1: URL Validation
  // ----------------------------------------------------
  console.log('\n--- 1. URL Validation Suite ---');
  
  const v1 = validateInstagramUrl('https://www.instagram.com/p/DF123abc/');
  assert(v1.isValid && v1.postId === 'DF123abc' && v1.postType === 'p', 'Valid post URL parsed correctly');

  const v2 = validateInstagramUrl('https://instagram.com/reel/C89xyz123/?utm_source=ig_web');
  assert(v2.isValid && v2.postId === 'C89xyz123' && v2.postType === 'reel', 'Valid reel URL parsed with query params');

  const v3 = validateInstagramUrl('https://www.instagram.com/tv/B456def/');
  assert(v3.isValid && v3.postId === 'B456def' && v3.postType === 'tv', 'Valid IGTV URL parsed correctly');

  const v4 = validateInstagramUrl('https://www.instagram.com/google/');
  assert(!v4.isValid && v4.error.includes('Bulk profile URLs are not supported'), 'Profile/bulk URL rejected with informative error');

  const v5 = validateInstagramUrl('https://twitter.com/p/12345');
  assert(!v5.isValid, 'Non-Instagram URL rejected');

  const v6 = validateInstagramUrl('');
  assert(!v6.isValid, 'Empty URL string rejected');

  // ----------------------------------------------------
  // TEST SUITE 2: Date Normalization
  // ----------------------------------------------------
  console.log('\n--- 2. Date Normalization Suite ---');

  assert(normalizeDate('November 27, 2026') === '2026-11-27', 'Normalized "November 27, 2026" -> "2026-11-27"');
  assert(normalizeDate('27 Nov 2026') === '2026-11-27', 'Normalized "27 Nov 2026" -> "2026-11-27"');
  assert(normalizeDate('15 October 2026') === '2026-10-15', 'Normalized "15 October 2026" -> "2026-10-15"');
  assert(normalizeDate('2026-12-31') === '2026-12-31', 'Normalized ISO "2026-12-31"');
  assert(normalizeDate('31/12/2026') === '2026-12-31', 'Normalized DMY "31/12/2026" -> "2026-12-31"');
  assert(normalizeDate('27th November 2026') === '2026-11-27', 'Normalized ordinal "27th November 2026" -> "2026-11-27"');
  assert(normalizeDate('Random invalid string') === null, 'Invalid date string gracefully returns null');
  assert(normalizeDate(null) === null, 'Null date input gracefully returns null');

  // ----------------------------------------------------
  // TEST SUITE 3: Opportunity Type Classification
  // ----------------------------------------------------
  console.log('\n--- 3. Opportunity Type Classification Suite ---');

  assert(classifyOpportunityType('Summer Research Internship 2026') === 'Internship', 'Classified Internship');
  assert(classifyOpportunityType('Fully Funded DAAD Scholarship') === 'Scholarship', 'Classified Scholarship');
  assert(classifyOpportunityType('UN Postdoctoral Fellowship') === 'Fellowship', 'Classified Fellowship');
  assert(classifyOpportunityType('Student Researcher at DeepMind') === 'Research Opportunity', 'Classified Research Opportunity');
  assert(classifyOpportunityType('Global Innovation Hackathon') === 'Competition', 'Classified Competition');

  // ----------------------------------------------------
  // TEST SUITE 4: User Example Matching (Google Internship)
  // ----------------------------------------------------
  console.log('\n--- 4. Primary User Example Benchmark (Google Internship) ---');

  const googleFixture = fetchFromFixtureFile('scripts/instagram-opportunity/fixtures/post_sample_google_internship.json');
  const googleParsed = parseOpportunity({
    rawCaption: googleFixture.rawCaption,
    rawOcrText: googleFixture.rawOcrText,
    sourceUrl: googleFixture.sourceUrl,
    sourceAccount: googleFixture.sourceAccount
  });

  assert(googleParsed.title === 'Google Student Researcher Internship 2026', `Title extracted: "${googleParsed.title}"`);
  assert(googleParsed.organization === 'Google', `Organization extracted: "${googleParsed.organization}"`);
  assert(googleParsed.opportunity_type === 'Internship', `Type classified: "${googleParsed.opportunity_type}"`);
  assert(googleParsed.location === 'USA', `Location extracted: "${googleParsed.location}"`);
  assert(googleParsed.eligibility === 'Students worldwide', `Eligibility extracted: "${googleParsed.eligibility}"`);
  assert(googleParsed.deadline === '2026-11-27', `Deadline normalized: "${googleParsed.deadline}"`);
  assert(Array.isArray(googleParsed.benefits) && googleParsed.benefits.length >= 4, `Benefits parsed: ${googleParsed.benefits.length} items`);
  assert(googleParsed.application_url === null, 'Application URL is null when not in text');
  assert(googleParsed.application_instructions.includes('story and highlights'), `Instructions parsed: "${googleParsed.application_instructions}"`);
  assert(googleParsed.source_platform === 'Instagram', 'Source platform is Instagram');
  assert(googleParsed.source_account === '@google', `Source account is "@google"`);

  // ----------------------------------------------------
  // TEST SUITE 5: DAAD Scholarship & UN Fellowship Fixtures
  // ----------------------------------------------------
  console.log('\n--- 5. Academic & Global Organization Fixtures ---');

  const daadFixture = fetchFromFixtureFile('scripts/instagram-opportunity/fixtures/post_sample_daad_scholarship.json');
  const daadParsed = parseOpportunity({
    rawCaption: daadFixture.rawCaption,
    rawOcrText: daadFixture.rawOcrText,
    sourceUrl: daadFixture.sourceUrl,
    sourceAccount: daadFixture.sourceAccount
  });

  assert(daadParsed.organization === 'DAAD', `DAAD organization matched: "${daadParsed.organization}"`);
  assert(daadParsed.opportunity_type === 'Scholarship', `DAAD type matched: "${daadParsed.opportunity_type}"`);
  assert(daadParsed.location === 'Germany', `DAAD location matched: "${daadParsed.location}"`);
  assert(daadParsed.deadline === '2026-10-15', `DAAD deadline normalized: "${daadParsed.deadline}"`);

  const unFixture = fetchFromFixtureFile('scripts/instagram-opportunity/fixtures/post_sample_un_fellowship.json');
  const unParsed = parseOpportunity({
    rawCaption: unFixture.rawCaption,
    rawOcrText: unFixture.rawOcrText,
    sourceUrl: unFixture.sourceUrl,
    sourceAccount: unFixture.sourceAccount
  });

  assert(unParsed.organization === 'United Nations', `UN organization matched: "${unParsed.organization}"`);
  assert(unParsed.opportunity_type === 'Fellowship', `UN type matched: "${unParsed.opportunity_type}"`);
  assert(unParsed.location === 'Switzerland', `UN location matched: "${unParsed.location}"`);
  assert(unParsed.deadline === '2026-12-31', `UN deadline normalized: "${unParsed.deadline}"`);
  assert(unParsed.application_url === 'https://careers.un.org/fellowship-2026', `UN application URL extracted: "${unParsed.application_url}"`);

  // ----------------------------------------------------
  // TEST SUITE 6: Missing Fields & Non-Hallucination
  // ----------------------------------------------------
  console.log('\n--- 6. Missing Fields & Non-Hallucination Suite ---');

  const fluffFixture = fetchFromFixtureFile('scripts/instagram-opportunity/fixtures/post_sample_minimal_fluff.json');
  const fluffParsed = parseOpportunity({
    rawCaption: fluffFixture.rawCaption,
    rawOcrText: fluffFixture.rawOcrText,
    sourceUrl: fluffFixture.sourceUrl,
    sourceAccount: fluffFixture.sourceAccount
  });

  assert(fluffParsed.deadline === null, 'Missing deadline returns null without hallucination');
  assert(fluffParsed.location === null, 'Missing location returns null without hallucination');
  assert(fluffParsed.application_url === null, 'Missing application URL returns null without hallucination');
  assert(Array.isArray(fluffParsed.benefits) && fluffParsed.benefits.length === 0, 'Missing benefits returns empty array []');

  // ----------------------------------------------------
  // TEST SUITE 7: Malformed / Empty Input Resilience
  // ----------------------------------------------------
  console.log('\n--- 7. Malformed Input Resilience Suite ---');

  const malformedFixture = fetchFromFixtureFile('scripts/instagram-opportunity/fixtures/post_sample_malformed.json');
  const malformedParsed = parseOpportunity({
    rawCaption: malformedFixture.rawCaption,
    rawOcrText: malformedFixture.rawOcrText,
    sourceUrl: malformedFixture.sourceUrl,
    sourceAccount: malformedFixture.sourceAccount
  });

  assert(malformedParsed.title === null, 'Malformed post has title: null');
  assert(malformedParsed.organization === null, 'Malformed post has organization: null');
  assert(malformedParsed.deadline === null, 'Malformed post has deadline: null');
  assert(malformedParsed.source_platform === 'Instagram', 'Malformed post maintains schema metadata');

  // ----------------------------------------------------
  // TEST SUITE 8: CLI Execution & Output File Saving
  // ----------------------------------------------------
  console.log('\n--- 8. CLI Runner & Output File Suite ---');

  const tempOutputFile = 'test/temp_extracted_opportunity.json';
  if (fs.existsSync(tempOutputFile)) fs.unlinkSync(tempOutputFile);

  const cliResult = await runExtractor([
    '--file', 'scripts/instagram-opportunity/fixtures/post_sample_google_internship.json',
    '--output', tempOutputFile
  ]);

  assert(cliResult && cliResult.title === 'Google Student Researcher Internship 2026', 'CLI runner executed successfully');
  assert(fs.existsSync(tempOutputFile), 'Output file created on disk');

  if (fs.existsSync(tempOutputFile)) {
    const savedContent = JSON.parse(fs.readFileSync(tempOutputFile, 'utf8'));
    assert(savedContent.organization === 'Google', 'Saved JSON file contains valid organization');
    fs.unlinkSync(tempOutputFile);
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    console.error('❌ SOME TESTS FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 ALL TEST SUITES PASSED 100%!');
  }
}

runAllTests().catch(err => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
