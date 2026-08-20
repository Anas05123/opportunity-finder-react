import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSqliteDatabase } from './db/sqliteClient.js';
import db, { initDatabase } from './db/database.js';
import { runScraperPipeline, startBackgroundScheduler } from './services/scheduler.js';
import { sendOutreachEmail } from './services/mailer.js';
import { analyzeCV, generateInterviewFeedback, handleCareerCopilot, parsePdfText } from './services/geminiAi.js';
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
app.use(express.json({ limit: '10mb' }));

// Mount Modular Sub-Routers
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v3/search', searchRouter);
app.use('/api/v3', searchRouter);

// -------------------------------------------------------------
// AI CAREER SUITE ENDPOINTS
// -------------------------------------------------------------

// PDF Upload & Text Parser (Multi-Tier: local engine + Gemini Multimodal OCR)
app.post('/api/v1/ai/parse-pdf', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'No PDF file data provided' });
    }

    const result = await parsePdfText(fileBase64, fileName);

    if (!result.text || result.text.length === 0) {
      return res.status(422).json({ 
        error: 'Unable to extract readable text from this PDF. It may be an encrypted or image-only scan.',
        status: 'empty'
      });
    }

    res.json({
      status: 'success',
      fileName: fileName || 'Uploaded_Resume.pdf',
      extractedText: result.text,
      pageCount: result.pageCount || 1,
      source: result.source
    });
  } catch (err) {
    console.error('[PDF Parse Error]:', err.message);
    res.status(500).json({ error: 'Failed to extract text from PDF: ' + err.message });
  }
});

// AI CV & ATS Analysis (Section 12)
app.post('/api/v1/ai/analyze-cv', async (req, res) => {
  try {
    const { cvText, fileBase64, targetRole, userProfile, employerType } = req.body;
    const analysis = await analyzeCV({ cvText, fileBase64, targetRole, userProfile, employerType });
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

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from React Vite build in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`[API SERVER] Opportunity Platform Intelligence API running on http://localhost:${PORT}`);
  startBackgroundScheduler(120);
});

