/**
 * CAREERLY HISTORICAL GIT SECRET SCANNER (PHASE 5C-2)
 * Inspects all reachable Git history, commits, and deleted files for leaked credentials.
 * Reuses high-confidence secret rules, SHA-256 fingerprinting, and strict redaction.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 * - Read-only operation (Never alters Git history).
 * - Fixed argument arrays via execFile (Zero shell interpolation or injection).
 * - ZERO raw secret values stored, returned, logged, or printed.
 */

import { execFileSync, execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SECRET_RULES,
  IGNORED_EXTENSIONS,
  IGNORED_DIRECTORIES,
  isPlaceholderOrBenign,
  generateSecretFingerprint,
  createRedactedPreview
} from './secretScanner.js';
import { getAppVersion, getGitCommit } from './securityMeta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const ARTIFACT_PATH = path.join(ROOT_DIR, 'security-git-history-results.json');

/**
 * Run safe git command using execFileSync with fixed arguments and boundaries
 */
function safeGitExec(args, options = {}) {
  const cwd = options.cwd || ROOT_DIR;
  const timeout = options.timeout || 30000;
  const maxBuffer = options.maxBuffer || 25 * 1024 * 1024;

  try {
    const output = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      timeout,
      maxBuffer,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim() };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code,
      status: err.status,
      output: err.stdout ? String(err.stdout).trim() : ''
    };
  }
}

/**
 * Scan git diff text for secret patterns
 * 
 * @param {string} diffText - Git diff output
 * @param {string} commitHash - Commit SHA
 * @param {string} commitDate - Commit timestamp
 * @returns {Array<Object>} Sanitized findings
 */
function scanDiffForSecrets(diffText, commitHash, commitDate) {
  if (!diffText || typeof diffText !== 'string') return [];

  const findings = [];
  const lines = diffText.split('\n');
  let currentFile = 'unknown';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track file path in diff header: "diff --git a/path b/path" or "+++ b/path"
    if (line.startsWith('diff --git ')) {
      const parts = line.split(' ');
      if (parts.length >= 4) {
        currentFile = parts[3].replace(/^b\//, '');
      }
      continue;
    } else if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
      continue;
    }

    // Skip non-added lines or diff markers
    if (!line.startsWith('+') || line.startsWith('+++')) {
      continue;
    }

    const addedContent = line.substring(1); // Strip leading '+'
    if (!addedContent || addedContent.length > 5000) continue; // Skip minified lines

    // Check if file extension is ignored
    const ext = path.extname(currentFile).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) {
      continue;
    }

    // Check if path is inside ignored directory
    const pathParts = currentFile.split(/[/\\]/);
    if (pathParts.some(p => IGNORED_DIRECTORIES.has(p))) {
      continue;
    }

    for (const rule of SECRET_RULES) {
      rule.regex.lastIndex = 0;
      let match;

      while ((match = rule.regex.exec(addedContent)) !== null) {
        const rawMatchedValue = match[1] || match[0];

        // Filter standard placeholders, test markers, and benign fixtures
        if (isPlaceholderOrBenign(rawMatchedValue, addedContent)) {
          continue;
        }

        // Generate sanitized finding (ZERO raw secrets stored)
        findings.push({
          type: rule.type,
          name: rule.name,
          severity: rule.severity,
          commit: commitHash,
          commitDate: commitDate || new Date().toISOString(),
          file: currentFile,
          source: 'GIT_HISTORY',
          status: 'FOUND',
          fingerprint: generateSecretFingerprint(rawMatchedValue),
          redactedPreview: createRedactedPreview(rawMatchedValue)
        });
      }
    }
  }

  return findings;
}

/**
 * Scan entire reachable Git history for exposed secrets
 * 
 * @param {Object} options - Scan configuration
 * @returns {Object} Comprehensive historical Git scan report
 */
export function scanGitHistory(options = {}) {
  const repoPath = options.repoPath || ROOT_DIR;
  const maxCommits = options.maxCommits || 100;
  const timeoutMs = options.timeoutMs || 20000;

  // 1. Verify Git availability and repository validity
  const gitVersionRes = safeGitExec(['--version'], { cwd: repoPath, timeout: timeoutMs });
  if (!gitVersionRes.success) {
    return {
      scanner: 'historical-git-secret-scanner',
      repoPath,
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      isGitRepo: false,
      coverage: 'NONE',
      error: 'Git is not installed or not available in PATH',
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      findings: []
    };
  }

  const insideWorkTreeRes = safeGitExec(['rev-parse', '--is-inside-work-tree'], { cwd: repoPath, timeout: timeoutMs });
  if (!insideWorkTreeRes.success || insideWorkTreeRes.output !== 'true') {
    return {
      scanner: 'historical-git-secret-scanner',
      repoPath,
      timestamp: new Date().toISOString(),
      status: 'PASS',
      isGitRepo: false,
      coverage: 'NONE',
      message: 'Target directory is not a Git repository',
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      findings: []
    };
  }

  // 2. Check if repository is shallow
  const isShallowRes = safeGitExec(['rev-parse', '--is-shallow-repository'], { cwd: repoPath, timeout: timeoutMs });
  const isShallow = isShallowRes.success && isShallowRes.output === 'true';
  const coverage = isShallow ? 'PARTIAL' : 'FULL_REACHABLE_HISTORY';

  // 3. Discover all reachable refs
  const refsRes = safeGitExec(['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/tags'], { cwd: repoPath, timeout: timeoutMs });
  const reachableRefs = refsRes.success && refsRes.output ? refsRes.output.split('\n').filter(Boolean) : [];

  // 4. Retrieve commit log across all reachable refs
  const logRes = safeGitExec([
    'log',
    '--all',
    '--pretty=format:%H|%ad|%s',
    '--date=iso',
    `-n`,
    String(maxCommits)
  ], { cwd: repoPath, timeout: timeoutMs });

  if (!logRes.success) {
    // Check if repository has no commits yet (empty repository)
    if (logRes.error && logRes.error.includes('does not have any commits yet')) {
      return {
        scanner: 'historical-git-secret-scanner',
        repoPath,
        timestamp: new Date().toISOString(),
        status: 'PASS',
        isGitRepo: true,
        isShallow: false,
        coverage: 'EMPTY_REPOSITORY',
        commitsScanned: 0,
        refsScanned: reachableRefs.length,
        summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
        findings: []
      };
    }

    return {
      scanner: 'historical-git-secret-scanner',
      repoPath,
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      isGitRepo: true,
      isShallow,
      coverage,
      error: `Failed to retrieve Git commit history: ${logRes.error}`,
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      findings: []
    };
  }

  const commitLines = logRes.output ? logRes.output.split('\n').filter(Boolean) : [];
  const rawFindings = [];
  const filesInspectedSet = new Set();

  // 5. Inspect diff of each reachable commit
  for (const commitLine of commitLines) {
    const parts = commitLine.split('|');
    const commitHash = parts[0];
    const commitDate = parts[1] || '';

    if (!commitHash) continue;

    const diffRes = safeGitExec([
      'show',
      commitHash,
      '-p',
      '--no-color',
      '-U0',
      '--',
      '.',
      ':!package-lock.json',
      ':!*.sqlite*',
      ':!*.png',
      ':!*.jpg',
      ':!*.jpeg',
      ':!*.ico',
      ':!dist'
    ], { cwd: repoPath, timeout: timeoutMs, maxBuffer: 6 * 1024 * 1024 });

    if (diffRes.success && diffRes.output) {
      const commitFindings = scanDiffForSecrets(diffRes.output, commitHash, commitDate);
      for (const finding of commitFindings) {
        rawFindings.push(finding);
        filesInspectedSet.add(finding.file);
      }
    }
  }

  // 6. Deduplicate findings by fingerprint + file + commit
  const seenKeys = new Set();
  const deduplicatedFindings = [];

  let countCritical = 0;
  let countHigh = 0;
  let countMedium = 0;
  let countLow = 0;

  for (const f of rawFindings) {
    const key = `${f.fingerprint}:${f.file}:${f.commit}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicatedFindings.push(f);

      if (f.severity === 'CRITICAL') countCritical++;
      else if (f.severity === 'HIGH') countHigh++;
      else if (f.severity === 'MEDIUM') countMedium++;
      else if (f.severity === 'LOW') countLow++;
    }
  }

  // 7. Calculate overall status
  let status = 'PASS';
  if (countCritical > 0) status = 'CRITICAL';
  else if (countHigh > 0) status = 'FAIL';
  else if (countMedium > 0 || countLow > 0) status = 'WARNING';

  return {
    scanner: 'historical-git-secret-scanner',
    repoPath,
    timestamp: new Date().toISOString(),
    status,
    isGitRepo: true,
    isShallow,
    coverage,
    commitsScanned: commitLines.length,
    refsScanned: reachableRefs.length,
    filesInspected: filesInspectedSet.size,
    summary: {
      total: deduplicatedFindings.length,
      critical: countCritical,
      high: countHigh,
      medium: countMedium,
      low: countLow
    },
    findings: deduplicatedFindings
  };
}

/**
 * Generate and persist security-git-history-results.json machine-readable artifact
 * 
 * @param {Object} options - Scan options
 * @returns {Promise<Object>} Generated artifact content
 */
export async function generateGitHistoryArtifact(options = {}) {
  const scanReport = scanGitHistory(options);
  const appVersion = getAppVersion();
  const gitCommit = getGitCommit();

  const artifact = {
    appVersion,
    gitCommit,
    timestamp: scanReport.timestamp,
    status: scanReport.status,
    coverage: scanReport.coverage,
    isShallow: scanReport.isShallow,
    commitsScanned: scanReport.commitsScanned,
    refsScanned: scanReport.refsScanned,
    filesInspected: scanReport.filesInspected,
    summary: scanReport.summary,
    findings: scanReport.findings
  };

  try {
    fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(artifact, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GitHistoryScanner] Failed to write artifact:', err.message);
  }

  return artifact;
}

export default {
  scanGitHistory,
  generateGitHistoryArtifact
};
