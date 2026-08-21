import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');

/**
 * Detect Git commit SHA without shell interpolation
 */
export function getGitCommit(dir = ROOT_DIR) {
  try {
    const commit = execSync('git rev-parse --short HEAD', {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return commit || 'UNKNOWN';
  } catch (e) {
    return 'UNKNOWN';
  }
}

/**
 * Detect Application version from package.json
 */
export function getAppVersion(dir = ROOT_DIR) {
  try {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '2.0.0';
    }
  } catch (e) {}
  return '2.0.0';
}

export default {
  getGitCommit,
  getAppVersion
};
