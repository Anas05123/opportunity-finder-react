/**
 * CAREERLY DEPENDENCY VULNERABILITY SCANNER (PHASE 5B)
 * Executes deterministic software supply-chain audits using native npm audit --json.
 * Parses, normalizes, categorizes, and enforces strict vulnerability defense policies.
 * 
 * SECURITY CONTROLS:
 * - Fixed command and arguments (Zero arbitrary command injection)
 * - Strict 15s execution timeout and 10MB buffer boundaries
 * - Server-controlled execution path (Project ROOT_DIR only)
 * - Safe error handling (Execution failure != PASS)
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * Standard severity mapping for dependency vulnerabilities
 */
export const DEPENDENCY_SEVERITY_MAP = {
  critical: 'CRITICAL',
  high: 'HIGH',
  moderate: 'MEDIUM',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFORMATIONAL',
  informational: 'INFORMATIONAL'
};

/**
 * Deterministic Dependency Security Policy Matrix
 */
export const DEPENDENCY_POLICY = {
  CRITICAL: { status: 'FAIL', action: 'BLOCK', severity: 'CRITICAL' },
  HIGH: { status: 'FAIL', action: 'BLOCK', severity: 'HIGH' },
  MEDIUM: { status: 'WARNING', action: 'WARN', severity: 'MEDIUM' },
  LOW: { status: 'WARNING', action: 'LOG', severity: 'LOW' },
  INFORMATIONAL: { status: 'PASS', action: 'IGNORE', severity: 'INFORMATIONAL' }
};

/**
 * Normalize raw npm severity string to canonical system enum
 */
export function normalizeDependencySeverity(rawSeverity) {
  if (!rawSeverity) return 'INFORMATIONAL';
  const key = String(rawSeverity).trim().toLowerCase();
  return DEPENDENCY_SEVERITY_MAP[key] || 'INFORMATIONAL';
}

/**
 * Parse and evaluate an npm audit JSON payload deterministically
 * 
 * @param {Object} auditJson - Parsed JSON output from npm audit
 * @returns {Object} Structured scan results with normalized findings and overall status
 */
export function evaluateDependencyAuditJson(auditJson) {
  if (!auditJson || typeof auditJson !== 'object') {
    return {
      scanner: 'npm-audit',
      scannerVersion: 'npm-v2',
      lockfile: 'package-lock.json',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: 'Invalid or malformed audit JSON payload',
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      vulnerabilities: []
    };
  }

  const rawVulns = auditJson.vulnerabilities || {};
  const metadata = auditJson.metadata?.vulnerabilities || {};
  const normalizedVulns = [];

  let countCritical = 0;
  let countHigh = 0;
  let countMedium = 0;
  let countLow = 0;
  let countInfo = 0;

  let prodDeps = new Set();
  let devDeps = new Set();
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
    prodDeps = new Set(Object.keys(pkg.dependencies || {}));
    devDeps = new Set(Object.keys(pkg.devDependencies || {}));
  } catch(e) {}

  for (const [pkgName, vulnData] of Object.entries(rawVulns)) {
    const rawSev = typeof vulnData === 'string' ? vulnData : vulnData.severity;
    const canonicalSev = normalizeDependencySeverity(rawSev);
    const isDirect = Boolean(vulnData.isDirect);
    const range = vulnData.range || 'unknown';
    const fixAvailable = Boolean(vulnData.fixAvailable);
    const nodes = Array.isArray(vulnData.nodes) ? vulnData.nodes : [];

    // Determine production vs development impact
    const isDevNode = nodes.length > 0 && nodes.every(n => n.includes('devDependencies') || n.includes('dev/'));
    const isDirectDev = devDeps.has(pkgName) && !prodDeps.has(pkgName);
    const effects = Array.isArray(vulnData.effects) ? vulnData.effects : [];
    const isTransitiveDev = effects.length > 0 && effects.every(eff => devDeps.has(eff) && !prodDeps.has(eff));

    const isDevOnly = isDevNode || isDirectDev || isTransitiveDev;

    // Extract title, advisory URLs and CWE identifiers safely
    const advisories = [];
    if (Array.isArray(vulnData.via)) {
      for (const item of vulnData.via) {
        if (typeof item === 'object' && item !== null) {
          advisories.push({
            title: item.title || item.name || 'Advisory',
            url: item.url || null,
            cwe: Array.isArray(item.cwe) ? item.cwe : [],
            cvssScore: item.cvss?.score || null
          });
        }
      }
    }

    if (canonicalSev === 'CRITICAL') countCritical++;
    else if (canonicalSev === 'HIGH') countHigh++;
    else if (canonicalSev === 'MEDIUM') countMedium++;
    else if (canonicalSev === 'LOW') countLow++;
    else countInfo++;

    normalizedVulns.push({
      package: pkgName,
      severity: canonicalSev,
      rawSeverity: rawSev,
      isDirect,
      range,
      fixAvailable,
      isDevOnly,
      runtimeImpact: !isDevOnly,
      developmentImpact: true,
      advisories
    });
  }

  // Fallback to metadata counts if rawVulns map was structured differently
  if (normalizedVulns.length === 0 && metadata.total > 0) {
    countCritical = metadata.critical || 0;
    countHigh = metadata.high || 0;
    countMedium = metadata.moderate || 0;
    countLow = metadata.low || 0;
    countInfo = metadata.info || 0;
  }

  const total = countCritical + countHigh + countMedium + countLow + countInfo;

  // Determine overall status according to deterministic policy
  let overallStatus = 'PASS';
  if (countCritical > 0 || countHigh > 0) {
    overallStatus = 'FAIL';
  } else if (countMedium > 0 || countLow > 0) {
    overallStatus = 'WARNING';
  }

  return {
    scanner: 'npm-audit',
    scannerVersion: 'npm-v2',
    lockfile: 'package-lock.json',
    timestamp: new Date().toISOString(),
    status: overallStatus,
    summary: {
      critical: countCritical,
      high: countHigh,
      medium: countMedium,
      low: countLow,
      info: countInfo,
      total
    },
    vulnerabilities: normalizedVulns
  };
}

/**
 * Execute native npm audit scan safely within locked project boundaries
 * 
 * @param {Object} options - { timeoutMs: 15000, projectRoot: ROOT_DIR }
 * @returns {Promise<Object>} Structured audit findings
 */
export async function runDependencyAudit(options = {}) {
  const targetDir = options.projectRoot || ROOT_DIR;
  const timeoutMs = options.timeoutMs || 15000;

  const lockfilePath = path.join(targetDir, 'package-lock.json');
  if (!fs.existsSync(lockfilePath)) {
    return {
      scanner: 'npm-audit',
      scannerVersion: 'npm-v2',
      lockfile: 'MISSING',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: 'package-lock.json was not found in project directory',
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      vulnerabilities: []
    };
  }

  return new Promise((resolve) => {
    // Windows requires npm.cmd or invoking through npm
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'cmd.exe' : 'npm';
    const args = isWin ? ['/d', '/s', '/c', 'npm audit --json'] : ['audit', '--json'];

    execFile(
      cmd,
      args,
      {
        cwd: targetDir,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB max buffer boundary
        windowsHide: true
      },
      (error, stdout, stderr) => {
        if (error && !stdout) {
          // Execution crashed or timed out without stdout
          return resolve({
            scanner: 'npm-audit',
            scannerVersion: 'npm-v2',
            lockfile: 'package-lock.json',
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            error: error.message || 'Failed to execute npm audit command',
            summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
            vulnerabilities: []
          });
        }

        try {
          const parsed = JSON.parse(stdout);
          const evaluated = evaluateDependencyAuditJson(parsed);
          resolve(evaluated);
        } catch (parseErr) {
          resolve({
            scanner: 'npm-audit',
            scannerVersion: 'npm-v2',
            lockfile: 'package-lock.json',
            timestamp: new Date().toISOString(),
            status: 'ERROR',
            error: `Failed to parse npm audit JSON output: ${parseErr.message}`,
            summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
            vulnerabilities: []
          });
        }
      }
    );
  });
}

export default {
  DEPENDENCY_SEVERITY_MAP,
  DEPENDENCY_POLICY,
  normalizeDependencySeverity,
  evaluateDependencyAuditJson,
  runDependencyAudit
};
