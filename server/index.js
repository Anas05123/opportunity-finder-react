import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSqliteDatabase } from './db/sqliteClient.js';
import db, { initDatabase } from './db/database.js';
import { runScraperPipeline, startBackgroundScheduler } from './services/scheduler.js';
import { sendOutreachEmail } from './services/mailer.js';
import { analyzeCV, generateInterviewFeedback, handleCareerCopilot } from './services/geminiAi.js';
import { generateVerifiedJobUrl, testUrlHealth } from './services/linkVerifier.js';
import { isSafeExternalUrl } from './middleware/security.js';

// Modular Route Handlers
import opportunitiesRouter from './api/opportunities.routes.js';
import searchRouter from './api/search.routes.js';
import applicationsRouter from './api/applications.routes.js';

// Initialize Databases
initSqliteDatabase();
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Mount Modular Sub-Routers
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/applications', applicationsRouter);

// -------------------------------------------------------------
// AI CAREER SUITE ENDPOINTS
// -------------------------------------------------------------

// AI CV & ATS Analysis (Section 12)
app.post('/api/v1/ai/analyze-cv', async (req, res) => {
  try {
    const { cvText, targetRole, userProfile } = req.body;
    const analysis = await analyzeCV({ cvText, targetRole, userProfile });
    res.json({ status: 'success', analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Mock Interview Coach (Section 13)
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

// Backward-compatible smart-search endpoint
app.post('/api/v1/ai/smart-search', async (req, res) => {
  req.url = '/execute';
  searchRouter.handle(req, res);
});

// -------------------------------------------------------------
// SOURCES, ADMIN & SECURITY VERIFICATION
// -------------------------------------------------------------

// Real-time Link Verification & SSRF Defense (Section 18)
app.post('/api/v1/verify-link', async (req, res) => {
  try {
    const { opportunity, url } = req.body;
    const targetUrl = url || (opportunity ? generateVerifiedJobUrl(opportunity).verified_live_url : null);

    if (!isSafeExternalUrl(targetUrl)) {
      return res.status(400).json({ error: 'Blocked: URL fails SSRF safety boundary verification' });
    }

    const health = await testUrlHealth(targetUrl);
    res.json({
      status: 'success',
      verified_url: targetUrl,
      is_valid: health.is_valid,
      message: health.message
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scraper Ops Ingestion Pipeline
app.post('/api/v1/admin/scrape', async (req, res) => {
  try {
    const results = await runScraperPipeline();
    res.json({ status: 'success', message: 'Scraper pipeline executed successfully', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sources Registry
app.get('/api/v1/sources', (req, res) => {
  res.json({ status: 'success', total_sources: db.getSources().length, sources: db.getSources() });
});

// User Profile Sync
app.get('/api/v1/profile', (req, res) => {
  res.json({ status: 'success', profile: db.getUserProfile() });
});

app.post('/api/v1/profile', (req, res) => {
  const updated = db.saveUserProfile(req.body);
  res.json({ status: 'success', profile: updated });
});

// Email Outreach Dispatch
app.post('/api/v1/email/send', async (req, res) => {
  const { to, subject, body, fromName } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing recipient, subject, or email body.' });
  }

  try {
    const result = await sendOutreachEmail({ to, subject, body, fromName });
    res.json({
      status: 'success',
      message: `Email successfully dispatched to ${to}`,
      messageId: result.messageId
    });
  } catch (err) {
    res.status(500).json({ error: `SMTP Dispatch Error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`[API SERVER] Opportunity Platform Intelligence API running on http://localhost:${PORT}`);
  startBackgroundScheduler(120);
});
