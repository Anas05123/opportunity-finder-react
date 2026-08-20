import 'dotenv/config';
import sqliteDb from '../db/sqliteClient.js';
import { supabase } from '../services/supabaseClient.js';

async function syncAllToSupabase() {
  console.log('[Supabase Sync] Starting synchronization from SQLite to Supabase PostgreSQL...');

  // 1. Sync User Profile
  try {
    let profile = null;
    try {
      profile = sqliteDb.prepare('SELECT * FROM user_profile LIMIT 1').get();
    } catch (e) {}

    const profileData = {
      id: 'default_user',
      name: profile?.name || 'Anas',
      email: profile?.email || 'ayarianas79@gmail.com',
      degree: profile?.degree || 'Bachelor of Arts',
      major: profile?.major || 'Advertising & Marketing',
      university: profile?.university || 'Asia Pacific University (APU)',
      target_role: profile?.target_role || 'Digital Marketing Specialist',
      target_location: profile?.target_location || 'Malaysia',
      skills: ["Digital Marketing", "Social Media Marketing", "Content Strategy", "SEO/SEM"],
      updated_at: new Date().toISOString()
    };

    console.log('[Supabase Sync] Syncing User Profile...');
    const { error: pErr } = await supabase.from('user_profile').upsert(profileData);
    if (pErr) console.error('[Supabase Sync] Profile sync error:', pErr.message);
    else console.log('[Supabase Sync] ✓ User profile synced.');
  } catch (e) {
    console.warn('[Supabase Sync] Profile note:', e.message);
  }

  // 2. Sync Opportunities
  try {
    const opportunities = sqliteDb.prepare('SELECT * FROM opportunities').all();
    console.log(`[Supabase Sync] Found ${opportunities.length} opportunities in SQLite...`);

    if (opportunities.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < opportunities.length; i += chunkSize) {
        const chunk = opportunities.slice(i, i + chunkSize).map(op => {
          let reasons = [];
          let flags = [];
          try { if (op.match_reasons) reasons = JSON.parse(op.match_reasons); } catch (e) {}
          try { if (op.match_flags) flags = JSON.parse(op.match_flags); } catch (e) {}

          return {
            id: String(op.id),
            title: op.title || 'Opportunity',
            company_name: op.company || op.company_name || op.organization || null,
            organization: op.organization || op.company || op.company_name || null,
            opportunity_type: op.opportunity_type || op.type || 'job',
            location_country: op.location_country || 'Malaysia',
            location_city: op.location_city || 'Kuala Lumpur',
            location_raw: op.location_raw || null,
            is_remote: op.is_remote ? 1 : 0,
            work_modality: op.work_mode || op.work_modality || (op.is_remote ? 'remote' : 'onsite'),
            degree_level: op.degree_level || 'undergrad',
            field_of_study: op.field_of_study || 'general',
            is_paid: op.is_paid !== undefined ? op.is_paid : 1,
            salary_min: op.salary_min || null,
            salary_max: op.salary_max || null,
            salary_currency: op.salary_currency || 'MYR',
            stipend_text: op.stipend_text || null,
            deadline_utc: op.deadline_utc || null,
            deadline_raw: op.deadline_raw || null,
            no_ielts: op.no_ielts || 1,
            source_name: op.source_name || 'Official Portal',
            source_authority_level: op.source_authority_level || op.authority_level || 2,
            source_url: op.source_url || op.official_apply_url || null,
            job_page_url: op.job_page_url || op.official_program_url || null,
            application_url: op.application_url || op.official_apply_url || null,
            application_url_type: op.application_url_type || 'EXACT_JOB_APPLICATION',
            contact_email: op.contact_email || null,
            description_text: op.description || op.description_text || null,
            benefits_summary: op.benefits_summary || null,
            eligibility_summary: op.eligibility_summary || null,
            match_score: op.match_score || op.trust_score || 90,
            match_reasons: reasons,
            match_flags: flags,
            why_matches_you: op.why_matches_you || null,
            verification_level: op.verification_level || 4,
            verification_status: op.verification_status || 'VERIFIED_ACTIVE',
            confidence_score: op.confidence_score || 90.0,
            posted_at: op.posted_at || op.last_verified_at || new Date().toISOString()
          };
        });

        const { error: oErr } = await supabase.from('opportunities').upsert(chunk, { onConflict: 'id' });
        if (oErr) {
          console.error(`[Supabase Sync] Chunk ${i}-${i + chunk.length} error:`, oErr.message);
        } else {
          console.log(`[Supabase Sync] ✓ Synced chunk ${i + 1} to ${Math.min(i + chunkSize, opportunities.length)}`);
        }
      }
    }
  } catch (e) {
    console.warn('[Supabase Sync] Opportunities note:', e.message);
  }

  // 3. Sync Sources
  try {
    let sources = [];
    try { sources = sqliteDb.prepare('SELECT * FROM sources').all(); } catch (e) {}
    console.log(`[Supabase Sync] Found ${sources.length} sources in SQLite...`);

    if (sources.length > 0) {
      const formattedSources = sources.map(s => ({
        id: String(s.id),
        name: s.name,
        type: s.type || 'direct_company_ats',
        url: s.url || '',
        authority_level: s.authority_level || 2,
        frequency_hours: s.frequency_hours || 24,
        total_ingested: s.total_ingested || 0,
        active: s.active !== undefined ? s.active : 1
      }));
      const { error: sErr } = await supabase.from('sources').upsert(formattedSources, { onConflict: 'id' });
      if (sErr) console.error('[Supabase Sync] Sources error:', sErr.message);
      else console.log('[Supabase Sync] ✓ Sources synced successfully.');
    }
  } catch (e) {
    console.warn('[Supabase Sync] Sources note:', e.message);
  }

  console.log('[Supabase Sync] ✅ Database Synchronization Complete!');
}

syncAllToSupabase().catch(err => {
  console.error('[Supabase Sync Fatal Error]:', err);
});
