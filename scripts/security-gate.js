#!/usr/bin/env node

/**
 * CAREERLY CI/CD SECURITY GATE CLI RUNNER
 * Invoked in GitHub Actions and local deployment scripts.
 * 
 * Exit Codes:
 * 0 - All security checks passed. Deployment permitted.
 * 1 - Mandatory security failure. Deployment strictly blocked.
 */

import { evaluateDeploymentGate } from '../server/services/security/ciSecurityGate.js';

async function main() {
  console.log('================================================================');
  console.log('🛡️  CAREERLY CI/CD SECURITY DEPLOYMENT GATE');
  console.log('================================================================\n');

  try {
    const report = await evaluateDeploymentGate({
      writeArtifact: true
    });

    console.log(`📦 Application Version: ${report.appVersion}`);
    console.log(`🌿 Git Commit:         ${report.gitCommit}`);
    console.log(`⏱️  Evaluation Time:    ${report.timestamp}\n`);

    console.log('--- 1. Security Posture Evaluation ---');
    console.log(`  Authoritative Score:  ${report.score} / 100`);
    console.log(`  Security Status:      ${report.securityStatus}`);

    console.log('\n--- 2. Supply Chain & Code Scanners ---');
    if (report.summary.dependencies) {
      console.log(`  Dependencies (npm):   ${report.summary.dependencies.total} vulnerabilities (${report.summary.dependencies.critical} critical, ${report.summary.dependencies.high} high)`);
    }
    if (report.summary.secrets) {
      console.log(`  Source Secrets:       ${report.summary.secrets.total} findings (${report.summary.secrets.critical} critical, ${report.summary.secrets.high} high)`);
    }
    if (report.summary.bundle) {
      console.log(`  Client Bundle:        ${report.summary.bundle.total} leaks in dist/`);
    }
    if (report.summary.gitHistory) {
      console.log(`  Git Commit History:   ${report.summary.gitHistory.total} historical findings (${report.summary.gitHistory.critical} critical, ${report.summary.gitHistory.high} high)`);
    }

    if (report.warnings && report.warnings.length > 0) {
      console.log('\n--- Warnings (Non-Blocking) ---');
      report.warnings.forEach(w => console.log(`  [WARN] ⚠️  ${w}`));
    }

    console.log('\n================================================================');
    if (report.deploymentPermitted) {
      console.log('🎯 CI/CD GATE DECISION: [ PASS ] — DEPLOYMENT PERMITTED');
      console.log('================================================================\n');
      console.log('✅ All defensive gates passed. Proceeding with deployment pipeline.');
      process.exit(0);
    } else {
      console.error('🚫 CI/CD GATE DECISION: [ BLOCKED ] — DEPLOYMENT DENIED');
      console.log('================================================================\n');
      console.error('Blocking Reasons:');
      report.blockingReasons.forEach(r => console.error(`  [BLOCK] ✗ ${r}`));
      console.error('\n❌ Deployment blocked by security gate policy.');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n🚫 FATAL SECURITY GATE ERROR (FAIL-CLOSED):');
    console.error(`  ${err.message}`);
    console.error('\n❌ Deployment blocked due to gate execution failure.');
    process.exit(1);
  }
}

main();
