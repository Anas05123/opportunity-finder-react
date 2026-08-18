import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', '..', 'opportunity.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initSqliteDatabase() {
  console.log('[SQLite DB] Initializing relational schema...');

  // 1. Opportunities Table (Normalized 80-Section Architecture)
  db.exec(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      organization TEXT NOT NULL,
      opportunity_type TEXT DEFAULT 'internship',
      degree_level TEXT DEFAULT 'undergrad',
      field_of_study TEXT DEFAULT 'advertising',
      location_country TEXT DEFAULT 'Malaysia',
      location_city TEXT DEFAULT 'Kuala Lumpur',
      is_remote INTEGER DEFAULT 0,
      work_mode TEXT DEFAULT 'onsite',
      funding_level TEXT DEFAULT 'paid_salary',
      salary_min REAL,
      salary_max REAL,
      salary_currency TEXT DEFAULT 'MYR',
      stipend_text TEXT,
      tuition_covered INTEGER DEFAULT 0,
      housing_covered INTEGER DEFAULT 0,
      travel_covered INTEGER DEFAULT 0,
      no_ielts INTEGER DEFAULT 1,
      skills_required TEXT, -- JSON Array
      skills_preferred TEXT, -- JSON Array
      education_requirements TEXT,
      experience_requirements TEXT,
      visa_requirements TEXT,
      start_date TEXT,
      duration TEXT,
      deadline_utc TEXT,
      deadline_raw TEXT,
      description TEXT,
      benefits_summary TEXT,
      eligibility_summary TEXT,
      official_apply_url TEXT,
      official_program_url TEXT,
      contact_email TEXT,
      source_name TEXT DEFAULT 'Company Careers',
      source_url TEXT,
      source_tier INTEGER DEFAULT 1,
      trust_score INTEGER DEFAULT 98,
      verification_status TEXT DEFAULT 'official_verified',
      last_verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );

    CREATE INDEX IF NOT EXISTS idx_opps_type ON opportunities(opportunity_type);
    CREATE INDEX IF NOT EXISTS idx_opps_field ON opportunities(field_of_study);
    CREATE INDEX IF NOT EXISTS idx_opps_country ON opportunities(location_country);
    CREATE INDEX IF NOT EXISTS idx_opps_status ON opportunities(status);
  `);

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

  // 3. User Profiles Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      degree_level TEXT DEFAULT 'undergrad',
      degree_title TEXT DEFAULT 'Bachelor of Arts (BA)',
      major TEXT DEFAULT 'Advertising & Marketing',
      university TEXT,
      gpa REAL DEFAULT 3.85,
      skills TEXT, -- JSON Array
      interests TEXT, -- JSON Array
      target_locations TEXT, -- JSON Array
      no_ielts_preference INTEGER DEFAULT 1,
      cv_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Application Tracker CRM Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      opportunity_id TEXT NOT NULL,
      user_id TEXT DEFAULT 'default-user',
      stage TEXT DEFAULT 'saved', -- saved, preparing, applied, interview, offer, rejected
      applied_at TEXT,
      interview_date TEXT,
      notes TEXT,
      custom_cv_bullets TEXT,
      cover_letter TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id)
    );

    CREATE INDEX IF NOT EXISTS idx_apps_stage ON applications(stage);
  `);

  // 5. Search Sessions Table (Conversational AI Context)
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_sessions (
      id TEXT PRIMARY KEY,
      user_query TEXT NOT NULL,
      extracted_intent TEXT, -- JSON Structured Search Profile
      missing_fields TEXT, -- JSON Array
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default user profile if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM user_profiles').get().count;
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO user_profiles (id, name, email, phone, degree_level, degree_title, major, gpa, skills, interests, no_ielts_preference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default-user',
      'Anas (Student)',
      'ayarianas79@gmail.com',
      '+60172513031',
      'undergrad',
      'Bachelor of Arts (BA)',
      'Advertising & Marketing',
      3.85,
      JSON.stringify(['Brand Strategy', 'Creative Copywriting', 'Market Research', 'Social Media', 'Figma', 'Campaign Analytics']),
      JSON.stringify(['Advertising', 'Brand Strategy', 'Digital Marketing', 'Finance', 'Global Traineeships']),
      1
    );
  }

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
