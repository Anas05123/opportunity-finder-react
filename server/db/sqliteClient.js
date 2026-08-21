import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'opportunity.sqlite');

let db;
try {
  db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {}
} catch (err) {
  console.warn('[SQLite DB] Note: disk database initialization fallback to memory:', err.message);
  try {
    db = new Database(':memory:');
  } catch (e) {
    db = {
      prepare: () => ({ get: () => null, all: () => [], run: () => ({ changes: 0 }) }),
      exec: () => {},
      pragma: () => {}
    };
  }
}

export function initSqliteDatabase() {
  if (!db || typeof db.exec !== 'function') return;
  console.log('[SQLite DB] Initializing relational schema...');

  // 1. Opportunities Table (Normalized 80-Section Architecture)
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      organization TEXT NOT NULL,
      opportunity_type TEXT DEFAULT 'internship',
      category TEXT DEFAULT 'General',
      degree_level TEXT DEFAULT 'undergrad',
      field_of_study TEXT DEFAULT 'advertising',
      location_country TEXT DEFAULT 'Malaysia',
      location_city TEXT DEFAULT 'Kuala Lumpur',
      location_raw TEXT,
      is_remote INTEGER DEFAULT 0,
      work_mode TEXT DEFAULT 'onsite',
      funding_level TEXT DEFAULT 'paid_salary',
      is_paid INTEGER DEFAULT 1,
      salary_min REAL,
      salary_max REAL,
      salary_currency TEXT DEFAULT 'MYR',
      salary_period TEXT DEFAULT 'monthly',
      stipend_text TEXT,
      tuition_covered INTEGER DEFAULT 0,
      housing_covered INTEGER DEFAULT 0,
      travel_covered INTEGER DEFAULT 0,
      no_ielts INTEGER DEFAULT 1,
      skills_required TEXT, -- JSON Array
      skills_preferred TEXT, -- JSON Array
      education_requirements TEXT,
      experience_requirements TEXT,
      experience_years_required INTEGER DEFAULT 0,
      visa_requirements TEXT,
      start_date TEXT,
      duration TEXT,
      deadline_utc TEXT,
      deadline_raw TEXT,
      description TEXT,
      responsibilities TEXT, -- JSON Array
      requirements TEXT, -- JSON Array
      benefits_summary TEXT,
      eligibility_summary TEXT,
      job_page_url TEXT,
      official_apply_url TEXT,
      official_program_url TEXT,
      application_url_type TEXT DEFAULT 'EXACT_JOB_APPLICATION',
      contact_email TEXT,
      source_name TEXT DEFAULT 'Company Careers',
      source_url TEXT,
      source_tier INTEGER DEFAULT 1,
      source_authority_level INTEGER DEFAULT 1,
      trust_score INTEGER DEFAULT 98,
      confidence_score REAL DEFAULT 95.0,
      verification_level INTEGER DEFAULT 5,
      verification_status TEXT DEFAULT 'VERIFIED_ACTIVE',
      last_verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );

    CREATE INDEX IF NOT EXISTS idx_opps_type ON opportunities(opportunity_type);
    CREATE INDEX IF NOT EXISTS idx_opps_field ON opportunities(field_of_study);
    CREATE INDEX IF NOT EXISTS idx_opps_country ON opportunities(location_country);
    CREATE INDEX IF NOT EXISTS idx_opps_city ON opportunities(location_city);
    CREATE INDEX IF NOT EXISTS idx_opps_status ON opportunities(status);
    CREATE INDEX IF NOT EXISTS idx_opps_verif ON opportunities(verification_status);

    -- 2. Field-Level Provenance & Evidence Table
    CREATE TABLE IF NOT EXISTS opportunity_evidence (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      source_url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      evidence_text TEXT NOT NULL,
      extracted_value TEXT NOT NULL, -- JSON
      retrieved_at TEXT NOT NULL,
      extraction_method TEXT NOT NULL,
      confidence REAL NOT NULL,
      is_verified INTEGER DEFAULT 1,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_evidence_opp_field ON opportunity_evidence(opportunity_id, field_name);

    -- 3. Temporal Snapshot & State Changelog Table
    CREATE TABLE IF NOT EXISTS opportunity_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opportunity_id TEXT NOT NULL,
      snapshot_timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      verification_status TEXT NOT NULL,
      verification_level INTEGER NOT NULL,
      salary_min REAL,
      salary_max REAL,
      stipend_text TEXT,
      deadline_at TEXT,
      application_url TEXT NOT NULL,
      application_url_type TEXT NOT NULL,
      http_status_code INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL,
      changes_detected_json TEXT DEFAULT '{}',
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_opp_time ON opportunity_snapshots(opportunity_id, snapshot_timestamp);
  `);

  // Auto-migrate any missing columns in existing opportunities table
  const columnsToAdd = [
    ['category', 'TEXT DEFAULT "General"'],
    ['location_raw', 'TEXT'],
    ['is_paid', 'INTEGER DEFAULT 1'],
    ['salary_period', 'TEXT DEFAULT "monthly"'],
    ['experience_years_required', 'INTEGER DEFAULT 0'],
    ['responsibilities', 'TEXT'],
    ['requirements', 'TEXT'],
    ['job_page_url', 'TEXT'],
    ['application_url_type', 'TEXT DEFAULT "EXACT_JOB_APPLICATION"'],
    ['source_authority_level', 'INTEGER DEFAULT 1'],
    ['confidence_score', 'REAL DEFAULT 95.0'],
    ['verification_level', 'INTEGER DEFAULT 5']
  ];

  for (const [col, def] of columnsToAdd) {
    try {
      db.exec(`ALTER TABLE opportunities ADD COLUMN ${col} ${def}`);
    } catch (e) {
      // Column already exists
    }
  }

  // 2. Sources Registry Table (48+ Sources)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      base_url TEXT NOT NULL,
      tier INTEGER DEFAULT 1,
      trust_score INTEGER DEFAULT 95,
      access_method TEXT DEFAULT 'html',
      country TEXT DEFAULT 'Global',
      status TEXT DEFAULT 'active',
      scrape_frequency_minutes INTEGER DEFAULT 240,
      last_scraped_at TEXT,
      last_success_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Multi-User Authentication & Identity Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_email_verified INTEGER DEFAULT 1,
      verification_token TEXT,
      reset_password_token TEXT,
      reset_password_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 4. User Career Profiles
    CREATE TABLE IF NOT EXISTS career_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      headline TEXT,
      phone TEXT,
      degree_level TEXT DEFAULT 'undergrad',
      degree_title TEXT DEFAULT 'Bachelor of Science (BSc)',
      field_of_study TEXT DEFAULT 'Computer Science',
      university TEXT,
      graduation_date TEXT,
      gpa REAL DEFAULT 3.5,
      experience_years INTEGER DEFAULT 0,
      skills TEXT DEFAULT '[]',
      interests TEXT DEFAULT '[]',
      languages TEXT DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      portfolio_url TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      resume_text TEXT,
      no_ielts_preference INTEGER DEFAULT 1,
      profile_completion INTEGER DEFAULT 40,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_career_profiles_user ON career_profiles(user_id);

    -- 5. User Search Profiles & Preferences
    CREATE TABLE IF NOT EXISTS search_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      target_roles TEXT DEFAULT '[]',
      opportunity_types TEXT DEFAULT '["job","internship"]',
      industries TEXT DEFAULT '[]',
      required_locations TEXT DEFAULT '[]',
      remote_only INTEGER DEFAULT 0,
      min_salary REAL DEFAULT 0,
      max_salary REAL,
      salary_currency TEXT DEFAULT 'USD',
      visa_sponsorship_required INTEGER DEFAULT 0,
      preferred_skills TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_search_profiles_user ON search_profiles(user_id);

    -- 6. Saved Opportunities (User Bookmarks)
    CREATE TABLE IF NOT EXISTS saved_opportunities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
      UNIQUE(user_id, opportunity_id)
    );

    CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_opportunities(user_id);

    -- 7. Application Tracker CRM Table (User-Owned)
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      opportunity_id TEXT NOT NULL,
      stage TEXT DEFAULT 'saved',
      applied_at TEXT,
      interview_date TEXT,
      notes TEXT,
      custom_cv_bullets TEXT,
      cover_letter TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
      UNIQUE(user_id, opportunity_id)
    );

    CREATE INDEX IF NOT EXISTS idx_apps_user_stage ON applications(user_id, stage);

    -- 8. User Search History
    CREATE TABLE IF NOT EXISTS user_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query TEXT NOT NULL,
      filters TEXT DEFAULT '{}',
      results_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_id);

    -- 9. User Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

    -- Backward compatibility user_profiles table if needed
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      degree_level TEXT DEFAULT 'undergrad',
      degree_title TEXT DEFAULT 'Bachelor of Science (BSc)',
      major TEXT DEFAULT 'Computer Science',
      university TEXT,
      gpa REAL DEFAULT 3.5,
      skills TEXT,
      interests TEXT,
      target_locations TEXT,
      no_ielts_preference INTEGER DEFAULT 1,
      cv_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Security Audit Runs (Audit Execution Engine)
    CREATE TABLE IF NOT EXISTS security_audit_runs (
      id TEXT PRIMARY KEY,
      suite_version TEXT NOT NULL DEFAULT '2.0.0',
      app_version TEXT NOT NULL DEFAULT '2.0.0',
      git_commit TEXT DEFAULT 'HEAD',
      triggered_by TEXT DEFAULT 'system',
      total_checks INTEGER NOT NULL DEFAULT 0,
      passed_checks INTEGER NOT NULL DEFAULT 0,
      failed_checks INTEGER NOT NULL DEFAULT 0,
      warning_checks INTEGER NOT NULL DEFAULT 0,
      score REAL,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('HEALTHY', 'WARNING', 'DEGRADED', 'CRITICAL', 'NOT_VERIFIED', 'SECURITY_VERIFICATION_OUTDATED', 'IN_PROGRESS', 'PASSED', 'FAILED')),
      duration_ms INTEGER DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      metadata_json TEXT DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_sec_audit_status ON security_audit_runs(status, started_at);

    -- 11. Security Checks (Itemized Verification Records)
    CREATE TABLE IF NOT EXISTS security_checks (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      check_key TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL')),
      status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARNING', 'NOT_RUN')),
      execution_time_ms INTEGER DEFAULT 0,
      evidence_text TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES security_audit_runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sec_checks_run ON security_checks(run_id, status);
    CREATE INDEX IF NOT EXISTS idx_sec_checks_cat ON security_checks(category, severity);
    CREATE INDEX IF NOT EXISTS idx_sec_checks_key ON security_checks(check_key);

    -- 12. Security Events (Runtime Audit & Defense Logging)
    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL')),
      actor_user_id TEXT,
      actor_ip TEXT,
      actor_email_hash TEXT,
      request_path TEXT,
      request_method TEXT,
      details_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sec_events_type ON security_events(event_type, severity, created_at);
    CREATE INDEX IF NOT EXISTS idx_sec_events_user ON security_events(actor_user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sec_events_time ON security_events(created_at);

    -- 13. Security Alerts (Phase 5C-5 Alerting & Operational Monitoring)
    CREATE TABLE IF NOT EXISTS security_alerts (
      id TEXT PRIMARY KEY,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL')),
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'TRIGGERED' CHECK (status IN ('TRIGGERED', 'DELIVERED', 'FAILED', 'SUPPRESSED', 'RESOLVED')),
      fingerprint TEXT NOT NULL,
      details_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sec_alerts_type ON security_alerts(alert_type, severity, created_at);
    CREATE INDEX IF NOT EXISTS idx_sec_alerts_fp ON security_alerts(fingerprint, created_at);
    CREATE INDEX IF NOT EXISTS idx_sec_alerts_status ON security_alerts(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_sec_alerts_time ON security_alerts(created_at);

    -- 14. Security Alert Deliveries (Channel Dispatch & Audit Log)
    CREATE TABLE IF NOT EXISTS security_alert_deliveries (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SLACK', 'WEBHOOK')),
      status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
      error_message TEXT,
      duration_ms INTEGER DEFAULT 0,
      attempt_count INTEGER DEFAULT 1,
      delivered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES security_alerts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sec_alert_deliv_alert ON security_alert_deliveries(alert_id, status);
    CREATE INDEX IF NOT EXISTS idx_sec_alert_deliv_time ON security_alert_deliveries(delivered_at);
  `);

  // Seed primary administrator account under Anas (ayarianas79@gmail.com)
  import('bcryptjs').then(bcrypt => {
    const adminHash = bcrypt.default.hashSync('Admin12345!', 10);
    const anasId = 'admin-anas-001';

    // 1. Primary Admin Account: Anas
    const existingAnas = db.prepare('SELECT id FROM users WHERE email = ?').get('ayarianas79@gmail.com');
    if (!existingAnas) {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, is_email_verified)
        VALUES (?, ?, ?, ?, ?)
      `).run(anasId, 'ayarianas79@gmail.com', adminHash, 'admin', 1);

      db.prepare(`
        INSERT INTO career_profiles (id, user_id, full_name, headline, degree_level, degree_title, field_of_study, gpa, skills, interests, profile_completion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'cp-anas',
        anasId,
        'Anas',
        'Founder & Lead Scholar — Advertising & Brand Strategy',
        'undergrad',
        'Bachelor of Arts (BA)',
        'Advertising & Brand Strategy',
        3.85,
        JSON.stringify(['Brand Strategy & Positioning', 'Creative Copywriting', 'Market Analysis', 'Figma & UI Design', 'Full-Stack Architecture']),
        JSON.stringify(['Brand Strategy', 'Global Fellowships', 'Creative Direction']),
        100
      );

      db.prepare(`
        INSERT INTO search_profiles (id, user_id, target_roles, required_locations, remote_only)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        'sp-anas',
        anasId,
        JSON.stringify(['Brand Strategist', 'Advertising Trainee', 'Marketing Specialist']),
        JSON.stringify(['Netherlands', 'Germany', 'Worldwide', 'Remote']),
        0
      );
    } else {
      // Ensure existing account has admin privileges
      db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run('ayarianas79@gmail.com');
      db.prepare("UPDATE career_profiles SET full_name = 'Anas' WHERE user_id = ?").run(existingAnas.id);
    }

    console.log('[SQLite DB] Administrator account configured for Anas (ayarianas79@gmail.com).');
  }).catch(e => console.warn('[SQLite DB] Seed bcrypt error:', e.message));

  // Seed initial opportunities from existing opportunities_db.json if empty
  const oppCount = db.prepare('SELECT COUNT(*) as count FROM opportunities').get().count;
  const jsonDbPath = path.join(__dirname, '..', '..', 'opportunities_db.json');
  if (oppCount === 0 && fs.existsSync(jsonDbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
      if (Array.isArray(data.opportunities)) {
        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO opportunities (
            id, title, company, organization, opportunity_type, degree_level, field_of_study,
            location_country, location_city, stipend_text, deadline_utc, deadline_raw,
            no_ielts, description, benefits_summary, eligibility_summary, official_apply_url,
            official_program_url, contact_email, source_name, source_url, trust_score, verification_status, last_verified_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
        `);

        for (const o of data.opportunities) {
          insertStmt.run(
            o.id,
            o.title || 'Opportunity',
            o.organization || 'Company',
            o.organization || 'Company',
            o.type || 'internship',
            o.degree_level || 'undergrad',
            o.field_of_study || 'general',
            o.location_country || 'Malaysia',
            o.location_city || 'Kuala Lumpur',
            o.stipend_text || 'Competitive Stipend',
            o.deadline_utc || '2026-12-31',
            o.deadline_raw || o.deadline_utc || '2026-12-31',
            o.no_ielts ?? 1,
            o.description || '',
            o.benefits_summary || '',
            o.eligibility_summary || '',
            o.official_apply_url || '',
            o.official_program_url || '',
            o.contact_email || 'careers@' + (o.organization || 'company').toLowerCase().replace(/[^a-z]/g, '') + '.com',
            o.source_name || 'Official Corporate Portal',
            o.official_program_url || o.official_apply_url || '',
            o.trust_score || 98,
            o.verification_status || 'official_verified',
            new Date().toISOString()
          );
        }
        console.log(`[SQLite DB] Seeded ${data.opportunities.length} master opportunities into SQLite.`);
      }
    } catch (e) {
      console.warn('[SQLite DB] Migration from JSON note:', e.message);
    }
  }

  console.log('[SQLite DB] Schema initialization complete.');
}

export default db;
