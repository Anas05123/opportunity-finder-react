/**
 * CAREERLY FRONTEND BUNDLE SECURITY SCANNER (PHASE 5B)
 * Inspects generated production assets (dist/assets/*.js, dist/assets/*.css)
 * to verify backend secrets, private credentials, and API keys are not exposed to clients.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scanContentForSecrets } from './secretScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * Scan the built frontend bundle in dist/
 * 
 * @param {Object} options - { distDir: path.join(ROOT_DIR, 'dist') }
 * @returns {Object} Structured bundle scan results
 */
export function runBundleSecretScan(options = {}) {
  const distDir = options.distDir || path.join(ROOT_DIR, 'dist');

  if (!fs.existsSync(distDir)) {
    return {
      scanner: 'frontend-bundle-scanner',
      distPath: 'dist',
      timestamp: new Date().toISOString(),
      status: 'NOT_RUN',
      message: 'dist directory does not exist. Run npm run build first.',
      filesScanned: 0,
      summary: { critical: 0, high: 0, medium: 0, total: 0 },
      findings: []
    };
  }

  const assetsDir = path.join(distDir, 'assets');
  const filesToScan = [];

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    for (const f of assetFiles) {
      if (f.endsWith('.js') || f.endsWith('.css') || f.endsWith('.html')) {
        filesToScan.push(path.join(assetsDir, f));
      }
    }
  }

  const indexHtml = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    filesToScan.push(indexHtml);
  }

  const allFindings = [];
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;

  for (const filePath of filesToScan) {
    try {
      const relPath = path.relative(ROOT_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf-8');
      const findings = scanContentForSecrets(content, relPath);

      for (const finding of findings) {
        if (finding.severity === 'CRITICAL') criticalCount++;
        else if (finding.severity === 'HIGH') highCount++;
        else mediumCount++;

        allFindings.push(finding);
      }
    } catch (e) {}
  }

  let status = 'PASS';
  if (criticalCount > 0) status = 'FAIL';
  else if (highCount > 0 || mediumCount > 0) status = 'WARNING';

  return {
    scanner: 'frontend-bundle-scanner',
    distPath: path.relative(ROOT_DIR, distDir),
    timestamp: new Date().toISOString(),
    status,
    filesScanned: filesToScan.length,
    summary: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      total: allFindings.length
    },
    findings: allFindings
  };
}

export default {
  runBundleSecretScan
};
