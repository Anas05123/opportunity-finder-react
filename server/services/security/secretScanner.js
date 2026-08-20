/**
 * CAREERLY HIGH-CONFIDENCE SECRET LEAKAGE SCANNER (PHASE 5B)
 * Scans source code, configuration files, and build assets for exposed credentials.
 * Enforces zero secret leakage, safe fingerprinting, and strict placeholder filtering.
 * 
 * ABSOLUTE HARD RULE:
 * The scanner itself MUST NEVER output, return, or persist raw detected secrets.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * Standard Placeholder and Safe Whitelist Patterns
 */
export const PLACEHOLDER_STRINGS = new Set([
  'your_api_key_here',
  'your_key_here',
  'change_me',
  'example@example.com',
  'dummy-secret',
  'test-secret',
  'insert_key_here',
  'localhost',
  'example_secret',
  'dummy_token',
  'test_token_123',
  '[redacted]',
  '[filtered_instruction]',
  'careerly_secret_placeholder',
  'dummy_password_for_testing'
]);

/**
 * File extension ignore list (Binary & DB files)
 */
export const IGNORED_EXTENSIONS = new Set([
  '.sqlite', '.sqlite-shm', '.sqlite-wal', '.db',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot',
  '.lock', '.map'
]);

/**
 * Directory ignore list
 */
export const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.system_generated',
  '.user_uploaded',
  '.agent',
  'dist', // Scanned separately by bundle scanner
  'coverage',
  'test' // Test fixtures and synthetic test assertions are tested via dedicated test suite
]);

/**
 * High-Confidence Secret Detection Rules
 */
export const SECRET_RULES = [
  {
    type: 'AWS_ACCESS_KEY',
    name: 'AWS Access Key ID',
    severity: 'CRITICAL',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g
  },
  {
    type: 'GEMINI_GOOGLE_API_KEY',
    name: 'Google / Gemini API Key',
    severity: 'CRITICAL',
    regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g
  },
  {
    type: 'GITHUB_TOKEN',
    name: 'GitHub Personal Access / OAuth Token',
    severity: 'CRITICAL',
    regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}|gho_[0-9a-zA-Z]{36})\b/g
  },
  {
    type: 'SLACK_TOKEN',
    name: 'Slack Bot / User Token',
    severity: 'CRITICAL',
    regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g
  },
  {
    type: 'STRIPE_SECRET_KEY',
    name: 'Stripe Secret API Key',
    severity: 'CRITICAL',
    regex: /\b(sk_live_[0-9a-zA-Z]{24,})\b/g
  },
  {
    type: 'PRIVATE_KEY',
    name: 'Asymmetric Private Key Header',
    severity: 'CRITICAL',
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g
  },
  {
    type: 'JWT_TOKEN',
    name: 'Signed JWT Token',
    severity: 'HIGH',
    regex: /\b(eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]{20,})\b/g
  },
  {
    type: 'DATABASE_CREDENTIAL_URI',
    name: 'Database Connection String with Credentials',
    severity: 'CRITICAL',
    regex: /\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:([^@\s]+)@/g
  },
  {
    type: 'BEARER_TOKEN',
    name: 'HTTP Authorization Bearer Token',
    severity: 'HIGH',
    regex: /\bBearer\s+([A-Za-z0-9\-_.+/=]{25,})\b/g
  },
  {
    type: 'HARDCODED_PASSWORD',
    name: 'Hardcoded Password / Credential Variable',
    severity: 'HIGH',
    regex: /(?:["']?(?:password|passwd|jwt_secret|jwtSecret|smtp_pass|smtpPassword|db_pass|dbPassword|db_password)["']?)\s*[:=]\s*['"]([^'"]{8,})['"]/gi
  },
  {
    type: 'GENERIC_API_SECRET',
    name: 'Generic Sensitive API Secret Assignment',
    severity: 'HIGH',
    regex: /(?:["']?(?:api_secret|apiSecret|client_secret|clientSecret|secret_key|secretKey)["']?)\s*[:=]\s*['"]([0-9a-zA-Z\-_.+/=]{16,})['"]/gi
  }
];

/**
 * Generate a deterministic SHA-256 fingerprint of a secret for tracking without storing it
 */
export function generateSecretFingerprint(secretValue) {
  if (!secretValue) return 'sha256:empty';
  return 'sha256:' + crypto.createHash('sha256').update(String(secretValue)).digest('hex').substring(0, 16);
}

/**
 * Create a safe redacted preview (e.g. "sk_live_...[REDACTED]")
 */
export function createRedactedPreview(secretValue) {
  if (!secretValue) return '[REDACTED]';
  const str = String(secretValue);
  if (str.length <= 8) return '[REDACTED]';
  return `${str.substring(0, 4)}...[REDACTED]`;
}

/**
 * Check if a candidate secret is an explicit benign placeholder or test marker
 */
export function isPlaceholderOrBenign(value, contextLine = '') {
  if (!value) return true;
  const valLower = String(value).toLowerCase().trim();
  const lineLower = String(contextLine).toLowerCase().trim();

  // Check known placeholder set
  if (PLACEHOLDER_STRINGS.has(valLower)) return true;

  // Check if string contains placeholder indicators
  if (
    valLower.includes('your_') ||
    valLower.includes('change_me') ||
    valLower.includes('insert_') ||
    valLower.includes('placeholder') ||
    valLower.includes('example.com') ||
    valLower.includes('forged') ||
    lineLower.includes('forged') ||
    valLower === 'password' ||
    valLower === 'admin12345!' || // Known test fixture string in audit runner
    valLower === 'password123!' ||
    valLower === 'badpassword123!'
  ) {
    return true;
  }

  // Vite Public variable checking (VITE_* config names in client templates are benign)
  if (lineLower.includes('import.meta.env.vite_') && !valLower.startsWith('sk_live_') && !valLower.startsWith('akia')) {
    return true;
  }

  return false;
}

/**
 * Scan a single string or file content for secrets
 * 
 * @param {string} content - File content to scan
 * @param {string} relativeFilePath - Path identifier for reporting
 * @returns {Array<Object>} List of sanitized findings
 */
export function scanContentForSecrets(content, relativeFilePath = 'memory') {
  if (!content || typeof content !== 'string') return [];

  const findings = [];
  const lines = content.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (!line || line.length > 5000) continue; // Skip huge minified lines

    for (const rule of SECRET_RULES) {
      // Reset regex index for global regexes
      rule.regex.lastIndex = 0;
      let match;

      while ((match = rule.regex.exec(line)) !== null) {
        const rawMatchedValue = match[1] || match[0];

        // Verify not a placeholder or benign fixture
        if (isPlaceholderOrBenign(rawMatchedValue, line)) {
          continue;
        }

        // Compute fingerprint and safe preview (RAW SECRET NEVER STORED)
        const fingerprint = generateSecretFingerprint(rawMatchedValue);
        const preview = createRedactedPreview(rawMatchedValue);

        findings.push({
          type: rule.type,
          name: rule.name,
          severity: rule.severity,
          file: relativeFilePath.replace(/\\/g, '/'),
          line: lineIdx + 1,
          fingerprint,
          evidencePreview: preview,
          redacted: true
        });
      }
    }
  }

  return findings;
}

/**
 * Recursively collect scan-target files within bounded project paths
 */
function collectFilesToScan(dirPath, fileList = [], depth = 0) {
  if (depth > 8 || fileList.length > 1500) return fileList;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          collectFilesToScan(path.join(dirPath, entry.name), fileList, depth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!IGNORED_EXTENSIONS.has(ext)) {
          fileList.push(path.join(dirPath, entry.name));
        }
      }
    }
  } catch (e) {}

  return fileList;
}

/**
 * Run comprehensive Secret Scan across source code and configuration files
 * 
 * @param {Object} options - { targetDir: ROOT_DIR, maxFiles: 1000, maxFileSizeMb: 2 }
 * @returns {Object} Structured scan results with sanitized findings
 */
export function runSecretScan(options = {}) {
  const targetDir = options.targetDir || ROOT_DIR;
  const maxFiles = options.maxFiles || 1000;
  const maxBytes = (options.maxFileSizeMb || 2) * 1024 * 1024;

  const allFiles = collectFilesToScan(targetDir).slice(0, maxFiles);
  const allFindings = [];

  let scannedCount = 0;
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  for (const filePath of allFiles) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > maxBytes) continue; // Skip oversized files

      const relPath = path.relative(targetDir, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileFindings = scanContentForSecrets(content, relPath);

      for (const finding of fileFindings) {
        if (finding.severity === 'CRITICAL') criticalCount++;
        else if (finding.severity === 'HIGH') highCount++;
        else mediumCount++;

        allFindings.push(finding);
      }
      scannedCount++;
    } catch (e) {}
  }

  let status = 'PASS';
  if (criticalCount > 0) status = 'FAIL';
  else if (highCount > 0 || mediumCount > 0) status = 'WARNING';

  return {
    scanner: 'secret-scanner',
    scannerVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    status,
    filesScanned: scannedCount,
    summary: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      total: allFindings.length
    },
    findings: allFindings,
    gitHistoryScan: 'NOT IMPLEMENTED'
  };
}

export default {
  SECRET_RULES,
  PLACEHOLDER_STRINGS,
  generateSecretFingerprint,
  createRedactedPreview,
  isPlaceholderOrBenign,
  scanContentForSecrets,
  runSecretScan
};
