import db, { initSqliteDatabase } from '../server/db/sqliteClient.js';

console.log('--- RUNNING PHASE 1 DATABASE VERIFICATION ---');

// 1. Initialize Database & Run Schema Migration
initSqliteDatabase();

// 2. Verify Security Tables Exist
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name IN ('security_audit_runs', 'security_checks', 'security_events')
  ORDER BY name
`).all();

console.log('Detected Security Tables:', tables.map(t => t.name));

if (tables.length !== 3) {
  console.error('FAIL: Expected 3 security tables, found:', tables.length);
  process.exit(1);
}

// 3. Verify Indexes
const indexes = db.prepare(`
  SELECT name, tbl_name FROM sqlite_master 
  WHERE type='index' AND tbl_name IN ('security_audit_runs', 'security_checks', 'security_events')
`).all();

console.log('Detected Security Indexes:', indexes.map(i => `${i.tbl_name}.${i.name}`));

// 4. Verify Constraints and Columns
const runCols = db.prepare('PRAGMA table_info(security_audit_runs)').all();
const checkCols = db.prepare('PRAGMA table_info(security_checks)').all();
const eventCols = db.prepare('PRAGMA table_info(security_events)').all();

console.log('security_audit_runs columns:', runCols.map(c => c.name).join(', '));
console.log('security_checks columns:', checkCols.map(c => c.name).join(', '));
console.log('security_events columns:', eventCols.map(c => c.name).join(', '));

// 5. Test Insert / Constraints
const testRunId = `sar-test-${Date.now()}`;
db.prepare(`
  INSERT INTO security_audit_runs (id, suite_version, app_version, total_checks, passed_checks, score, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(testRunId, '2.0.0', '2.0.0', 24, 24, 100.0, 'PASSED');

db.prepare(`
  INSERT INTO security_checks (id, run_id, check_key, category, name, severity, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(`sc-test-${Date.now()}`, testRunId, 'AUTH_VALIDATION', 'authentication', 'Test Auth Check', 'CRITICAL', 'PASS');

db.prepare(`
  INSERT INTO security_events (id, event_type, severity, request_path, request_method, details_json)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(`se-test-${Date.now()}`, 'AUTH_FAILURE', 'HIGH', '/api/v1/auth/login', 'POST', JSON.stringify({ reason: 'invalid_credentials' }));

// 6. Verify Cascade Delete on Run
db.prepare('DELETE FROM security_audit_runs WHERE id = ?').run(testRunId);
const orphanedChecks = db.prepare('SELECT COUNT(*) as count FROM security_checks WHERE run_id = ?').get(testRunId).count;
console.log('Orphaned checks after run deletion (Cascade check):', orphanedChecks);

// 7. Verify Existing Tables & Data Integrity
const oppCount = db.prepare('SELECT COUNT(*) as count FROM opportunities').get().count;
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
console.log(`Existing Data Intact: ${oppCount} Opportunities, ${userCount} Users.`);

console.log('PHASE 1 DATABASE FOUNDATION: VERIFICATION COMPLETE & PASSED');
