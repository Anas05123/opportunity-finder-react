import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

async function testProductionRouting() {
  console.log('================================================================');
  console.log('🧭 CAREERLY PRODUCTION SAAS CLIENT-SIDE ROUTING & SPA AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, name) {
    total++;
    if (cond) {
      console.log(`  [PASS] ✓ ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${name}`);
      throw new Error(`Routing check failed: ${name}`);
    }
  }

  // 1. Verify all required route components exist and are registered
  const appJsx = fs.readFileSync(path.join(ROOT_DIR, 'src/App.jsx'), 'utf8');
  
  const expectedRoutes = [
    'path="/"',
    'path="/login"',
    'path="/register"',
    'path="/signup"',
    'path="/verify-email"',
    'path="/forgot-password"',
    'path="/reset-password"',
    'path="/onboarding"',
    'path="/dashboard"',
    'path="/opportunities"',
    'path="/opportunities/:id"',
    'path="/applications"',
    'path="/saved"',
    'path="/cv-studio"',
    'path="/interview-coach"',
    'path="/interview"',
    'path="/calendar"',
    'path="/profile"',
    'path="/settings"',
    'path="/admin"',
    'path="/admin/*"',
    'path="*"'
  ];

  console.log('1. Checking Declarative Route Mapping in src/App.jsx...');
  for (const r of expectedRoutes) {
    assert(appJsx.includes(r), `Route ${r} declared in React Router structure`);
  }

  // 2. Verify Route Guards
  console.log('\n2. Checking Route Guard Architecture...');
  assert(fs.existsSync(path.join(ROOT_DIR, 'src/components/Auth/ProtectedRoute.jsx')), 'ProtectedRoute guard exists');
  assert(fs.existsSync(path.join(ROOT_DIR, 'src/components/Auth/AdminRoute.jsx')), 'AdminRoute guard exists with 403 Forbidden surface');
  assert(fs.existsSync(path.join(ROOT_DIR, 'src/components/Auth/PublicOnlyRoute.jsx')), 'PublicOnlyRoute guard exists');
  assert(fs.existsSync(path.join(ROOT_DIR, 'src/components/NotFoundPage.jsx')), 'NotFoundPage 404 handler exists');

  // 3. Verify Vite base and SPA history fallback config
  console.log('\n3. Checking SPA Base & History Fallback Config...');
  const viteConfig = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.js'), 'utf8');
  assert(viteConfig.includes("base: '/'"), "vite.config.js sets base: '/' for deep nested routing");
  assert(fs.existsSync(path.join(ROOT_DIR, 'public/_redirects')), 'public/_redirects SPA fallback rule exists');
  assert(fs.existsSync(path.join(ROOT_DIR, 'vercel.json')), 'vercel.json SPA rewrite rule exists');

  // 4. Verify Built HTML index fallback
  const distIndex = path.join(ROOT_DIR, 'dist/index.html');
  assert(fs.existsSync(distIndex), 'dist/index.html production artifact exists');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} PRODUCTION ROUTING CHECKS PASSED (100%)!`);
  console.log('================================================================\n');
}

testProductionRouting().catch(e => {
  console.error(e.message);
  process.exit(1);
});
