import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db, { initDatabase } from './db/database.js';
import { runScraperPipeline, startBackgroundScheduler } from './services/scheduler.js';
import { sendOutreachEmail } from './services/mailer.js';
import { analyzeCV, generateInterviewFeedback, handleCareerCopilot, smartSearchWithGemini } from './services/geminiAi.js';
import { generateVerifiedJobUrl, testUrlHealth } from './services/linkVerifier.js';
import { scrapeLiveJobsForQuery } from './services/liveSearchScraper.js';


// Initialize DB
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to sanitize opportunity URLs with verified live links
function sanitizeOpportunityLinks(opp) {
  if (!opp) return opp;
  const verified = generateVerifiedJobUrl(opp);
  return {
    ...opp,
    official_apply_url: verified.verified_live_url,
    linkedin_search_url: verified.linkedin_search_url,
    link_verification_status: verified.status,
    link_source_type: verified.source_type
  };
}

// -------------------------------------------------------------
// 1. GET /api/v1/opportunities (Filtered & Searchable)
// -------------------------------------------------------------
app.get('/api/v1/opportunities', (req, res) => {
  const results = db.getOpportunities(req.query).map(sanitizeOpportunityLinks);
  res.json({
    status: 'success',
    total_count: results.length,
    opportunities: results
  });
});

// -------------------------------------------------------------
// 2. GET /api/v1/opportunities/:id (Detail View)
// -------------------------------------------------------------
app.get('/api/v1/opportunities/:id', (req, res) => {
  const opp = db.getOpportunityById(req.params.id);
  if (!opp) {
    return res.status(404).json({ error: 'Opportunity not found' });
  }
  res.json({ status: 'success', opportunity: sanitizeOpportunityLinks(opp) });
});


// -------------------------------------------------------------
// 3. GET /api/v1/sources (Complete 48+ Source Registry)
// -------------------------------------------------------------
app.get('/api/v1/sources', (req, res) => {
  res.json({ status: 'success', total_sources: db.getSources().length, sources: db.getSources() });
});

// -------------------------------------------------------------
// 4. POST /api/v1/email/send (SMTP Automated Outreach Dispatch)
// -------------------------------------------------------------
app.post('/api/v1/email/send', async (req, res) => {
  const { to, subject, body, fromName } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing recipient, subject, or email body.' });
  }

  try {
    const result = await sendOutreachEmail({ to, subject, body, fromName });
    res.json({
      status: 'success',
      message: `Email successfully dispatched via Gmail SMTP to ${to}`,
      messageId: result.messageId
    });
  } catch (err) {
    res.status(500).json({ error: `SMTP Dispatch Error: ${err.message}` });
  }
});

// -------------------------------------------------------------
// 5. GET & POST /api/v1/profile (User Profile & Match)
// -------------------------------------------------------------
app.get('/api/v1/profile', (req, res) => {
  res.json({ status: 'success', profile: db.getUserProfile() });
});

app.post('/api/v1/profile', (req, res) => {
  const updated = db.saveUserProfile(req.body);
  res.json({ status: 'success', profile: updated });
});

// -------------------------------------------------------------
// 6. ADMIN ENDPOINTS (Sections 34 - 37)
// -------------------------------------------------------------
// Add new source to registry
app.post('/api/v1/admin/sources', (req, res) => {
  const { name, domain, base_url, tier, trust_score, access_method, country, scrape_frequency_minutes } = req.body;
  const newSource = {
    id: `src-${domain.replace(/[^\w]/g, '-')}`,
    name,
    domain,
    base_url: base_url || `https://${domain}`,
    tier: parseInt(tier) || 1,
    trust_score: parseInt(trust_score) || 95,
    access_method: access_method || 'html',
    country: country || 'Global',
    status: 'active',
    scrape_frequency_minutes: parseInt(scrape_frequency_minutes) || 240,
    last_scraped_at: 'Pending initial run',
    last_success_at: 'Pending initial run'
  };

  db.upsertSource(newSource);
  res.json({ status: 'success', message: 'Source added to registry', source: newSource });
});

// Update source status / trust score
app.put('/api/v1/admin/sources/:id', (req, res) => {
  const src = db.getSources().find(s => s.id === req.params.id);
  if (!src) return res.status(404).json({ error: 'Source not found' });

  const updated = { ...src, ...req.body, updated_at: new Date().toISOString() };
  db.upsertSource(updated);
  res.json({ status: 'success', source: updated });
});

// Trigger Immediate Automated Scraper
app.post('/api/v1/admin/scrape', async (req, res) => {
  try {
    const results = await runScraperPipeline();
    res.json({ status: 'success', message: 'Scraper pipeline executed successfully', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Opportunity
app.post('/api/v1/admin/opportunities/:id/verify', (req, res) => {
  const opp = db.getOpportunityById(req.params.id);
  if (!opp) return res.status(404).json({ error: 'Opportunity not found' });

  opp.verification_status = 'official_verified';
  opp.trust_score = 98;
  opp.last_verified_at = new Date().toISOString();
  db.upsertOpportunity(opp);

  res.json({ status: 'success', message: 'Opportunity officially verified', opportunity: opp });
});

// Archive Opportunity
app.delete('/api/v1/admin/opportunities/:id', (req, res) => {
  db.archiveOpportunity(req.params.id);
  res.json({ status: 'success', message: 'Opportunity archived' });
});

// -------------------------------------------------------------
// 7. APPLICATION TRACKER CRM (Section 29)
// -------------------------------------------------------------
app.get('/api/v1/tracker', (req, res) => {
  res.json({ status: 'success', items: db.getTracker() });
});

app.post('/api/v1/tracker', (req, res) => {
  const { opportunity_id, stage, notes } = req.body;
  db.saveTracker({ opportunity_id, stage: stage || 'saved', user_notes: notes || '' });
  res.json({ status: 'success', message: 'Saved to application tracker' });
});

// -------------------------------------------------------------
// 8. GET /api/v1/stats (Section 34)
// -------------------------------------------------------------
app.get('/api/v1/stats', (req, res) => {
  res.json(db.getStats());
});

// -------------------------------------------------------------
// 9. AI CAREER SERVICES (Gemini Powered)
// -------------------------------------------------------------

// AI CV & ATS Analysis
app.post('/api/v1/ai/analyze-cv', async (req, res) => {
  try {
    const { cvText, targetRole, userProfile } = req.body;
    const analysis = await analyzeCV({ cvText, targetRole, userProfile });
    res.json({ status: 'success', analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Mock Interview Coach
app.post('/api/v1/ai/interview-coach', async (req, res) => {
  try {
    const { role, company, question, answer, previousScore } = req.body;
    const feedback = await generateInterviewFeedback({ role, company, question, answer, previousScore });
    res.json({ status: 'success', feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Career Copilot Chat
app.post('/api/v1/ai/career-copilot', async (req, res) => {
  try {
    const { query, userProfile, chatHistory } = req.body;
    const reply = await handleCareerCopilot({ query, userProfile, chatHistory });
    res.json({ status: 'success', reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Smart Search & Live Job Hunter (Malaysia & Global with Real-Time Web Scraping)
app.post('/api/v1/ai/smart-search', async (req, res) => {

  try {
    const { query, userProfile } = req.body;
    if (!query || !query.trim()) {
      return res.json({ status: 'success', opportunities: db.getOpportunities({}).map(sanitizeOpportunityLinks) });
    }

    console.log(`[Smart Search API] Ingesting & scraping web for query: "${query}"`);
    
    // 1. Run live real-time web scrapers
    const liveScraped = await scrapeLiveJobsForQuery(query, userProfile);
    
    // 2. Run Gemini AI semantic search & portal resolver
    const aiResults = await smartSearchWithGemini({ query, userProfile });
    
    // Combine all scraped & AI findings
    const allDiscovered = [...liveScraped, ...aiResults];
    const uniqueDiscovered = [];
    const seen = new Set();
    for (const item of allDiscovered) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDiscovered.push(item);
      }
    }

    // 3. Upsert into master DB so they persist and are clickable with 1-Click apply
    for (const item of uniqueDiscovered) {
      db.upsertOpportunity(item);
    }

    // 4. Return matched results combining database search + live scraped opportunities
    const dbMatches = db.getOpportunities({ search: query });
    const combined = [...uniqueDiscovered, ...dbMatches.filter(d => !uniqueDiscovered.some(a => a.id === d.id))].map(sanitizeOpportunityLinks);

    res.json({
      status: 'success',
      total_count: combined.length,
      opportunities: combined,
      ai_discovered_count: uniqueDiscovered.length,
      scraped_count: liveScraped.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Real-time Link Verification & Health Extraction
app.post('/api/v1/verify-link', async (req, res) => {
  try {
    const { opportunity } = req.body;
    const verified = generateVerifiedJobUrl(opportunity);
    const health = await testUrlHealth(verified.verified_live_url);
    res.json({
      status: 'success',
      verified_url: verified.verified_live_url,
      linkedin_search_url: verified.linkedin_search_url,
      is_valid: health.is_valid,
      source_type: verified.source_type
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[API SERVER] Global Opportunities Intelligence API running on http://localhost:${PORT}`);
  
  // Start background 24/7 scraper daemon
  startBackgroundScheduler(120);
});



