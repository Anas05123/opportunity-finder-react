/**
 * CAREERLY SUPPLY CHAIN & SECRET AUDIT ORCHESTRATOR (PHASE 5B)
 * Coordinates dependency audits, secret leakage detection, and frontend bundle inspections.
 * Persists machine-readable security-supply-chain-results.json artifacts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDependencyAudit } from './dependencyScanner.js';
import { runSecretScan } from './secretScanner.js';
import { runBundleSecretScan } from './bundleScanner.js';
import { getAppVersion, getGitCommit } from './securityMeta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const ARTIFACT_PATH = path.join(ROOT_DIR, 'security-supply-chain-results.json');

/**
 * Execute complete Supply Chain & Secret Leakage Audit
 * 
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Unified supply chain report
 */
export async function executeSupplyChainAudit(options = {}) {
  const appVersion = getAppVersion();
  const gitCommit = getGitCommit();
  const timestamp = new Date().toISOString();

  // 1. Run Dependency Audit
  const dependencyResults = await runDependencyAudit({ projectRoot: ROOT_DIR });

  // 2. Run Source & Config Secret Scan
  const secretResults = runSecretScan({ targetDir: ROOT_DIR });

  // 3. Run Frontend Bundle Secret Scan
  const bundleResults = runBundleSecretScan({ distDir: path.join(ROOT_DIR, 'dist') });

  // 4. Calculate Unified Supply Chain Status
  let overallStatus = 'PASS';
  if (dependencyResults.status === 'ERROR' || secretResults.status === 'ERROR' || bundleResults.status === 'ERROR') {
    overallStatus = 'ERROR';
  } else if (dependencyResults.status === 'FAIL' || secretResults.status === 'FAIL' || bundleResults.status === 'FAIL') {
    overallStatus = 'FAIL';
  } else if (dependencyResults.status === 'WARNING' || secretResults.status === 'WARNING' || bundleResults.status === 'WARNING') {
    overallStatus = 'WARNING';
  }

  const report = {
    scanner: 'careerly-supply-chain-orchestrator',
    appVersion,
    gitCommit,
    timestamp,
    status: overallStatus,
    summary: {
      dependencies: dependencyResults.summary,
      secrets: secretResults.summary,
      bundle: bundleResults.summary
    },
    dependencyScan: dependencyResults,
    secretScan: secretResults,
    bundleScan: bundleResults
  };

  // 5. Persist Sanitized Machine-Readable Artifact
  try {
    fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  } catch (err) {
    console.error('[SupplyChainService] Failed to write artifact file:', err.message);
  }

  return report;
}

/**
 * Read the latest supply chain artifact from disk
 */
export function getLatestSupplyChainArtifact() {
  if (fs.existsSync(ARTIFACT_PATH)) {
    try {
      const raw = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
}

export default {
  executeSupplyChainAudit,
  getLatestSupplyChainArtifact
};
