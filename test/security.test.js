/**
 * CAREERLY AUTOMATED PENETRATION & CYBERSECURITY TEST SUITE (PHASE 2 INTEGRATED)
 * Verifies:
 * 1. Multi-Tenant Horizontal Isolation (User A vs User B)
 * 2. Privilege Escalation Defense (Normal User vs Admin)
 * 3. Deep SSRF Defense (127.0.0.1, 169.254.169.254, localhost, file://)
 * 4. Authentication & Forged Token Rejection
 * 5. PDF Upload Magic-Byte & Size Integrity
 * 6. HTTP Security Headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
 */

import { executeSecurityAudit } from '../server/services/securityAuditRunner.js';

async function runSecurityTests() {
  console.log('================================================================');
  console.log('🛡️  CAREERLY ENTERPRISE SECURITY AUDIT & PENETRATION TEST SUITE');
  console.log('================================================================\n');

  try {
    const result = await executeSecurityAudit({ triggeredBy: 'cli_test_suite' });
    const { audit_run, checks } = result;

    // Group checks by category for clean display
    const groups = {};
    for (const c of checks) {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    }

    let categoryIdx = 1;
    for (const [category, items] of Object.entries(groups)) {
      console.log(`--- ${categoryIdx++}. ${category.toUpperCase().replace(/_/g, ' ')} ---`);
      for (const item of items) {
        if (item.status === 'PASS') {
          console.log(`  [PASS] ✓ ${item.name} (${item.evidence_text || 'Verified'})`);
        } else {
          console.error(`  [FAIL] ✗ ${item.name} (${item.error_message || 'Check failed'})`);
        }
      }
      console.log('');
    }

    console.log('================================================================');
    console.log(`🎯 AUDIT COMPLETE: ${audit_run.passed_checks} Passed, ${audit_run.failed_checks} Failed`);
    console.log(`⏱️  Duration: ${audit_run.duration_ms}ms | Run ID: ${audit_run.id}`);
    console.log(`📦 App Version: ${audit_run.app_version} | Git Commit: ${audit_run.git_commit}`);
    console.log('================================================================\n');

    if (audit_run.failed_checks === 0) {
      console.log('✅ ALL DEFENSIVE GATES PASSED. CAREERLY IS PRODUCTION-HARDENED.');
      process.exit(0);
    } else {
      console.error('❌ SOME SECURITY CHECKS FAILED. PLEASE REVIEW FINDINGS.');
      process.exit(1);
    }
  } catch (err) {
    console.error('[Security Test Suite Fatal Error]:', err.message);
    process.exit(1);
  }
}

runSecurityTests();
