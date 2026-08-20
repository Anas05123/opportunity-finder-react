import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initSqliteDatabase } from './db/sqliteClient.js';
import db, { initDatabase } from './db/database.js';
import { runScraperPipeline, startBackgroundScheduler } from './services/scheduler.js';
import { sendOutreachEmail } from './services/mailer.js';
import { analyzeCV, generateInterviewFeedback, handleCareerCopilot, parsePdfText, getGeminiApiStatus } from './services/geminiAi.js';
import { generateVerifiedJobUrl, testUrlHealth } from './services/linkVerifier.js';
import { 
  isSafeExternalUrl, 
  verifySafeUrlWithDns, 
  authLimiter, 
  aiLimiter, 
  searchLimiter, 
  emailLimiter, 
  generalApiLimiter,
  validatePdfBase64,
  sanitizeFileName 
} from './middleware/security.js';
import { recordSecurityEvent, getSafeClientIp } from './services/security/securityEvents.js';

// Modular Route Handlers
import authRouter from './api/auth.routes.js';
import userRouter from './api/user.routes.js';
import opportunitiesRouter from './api/opportunities.routes.js';
import searchRouter from './api/search.routes.js';
import applicationsRouter from './api/applications.routes.js';
import securityRouter from './api/security.routes.js';
import { authenticateToken, optionalAuth, requireAdmin } from './middleware/auth.js';

// Initialize Databases
initSqliteDatabase();
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------------------------------------------
// 1. ENTERPRISE SECURITY HEADERS (HELMET)
// -------------------------------------------------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

// -------------------------------------------------------------
// 2. CONTROLLED CORS CONFIGURATION
// -------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://opportunity-finder-gsxr.onrender.com',
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser agents, curl, Postman, matching origins, or onrender.com subdomains
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      allowedOrigins.some(o => origin.startsWith(o)) ||
      (origin.endsWith('.onrender.com') && origin.startsWith('https://'))
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not permitted by Careerly CORS policy.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body Parsers with Strict Size Boundaries
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global General API Rate Limiter
app.use('/api', generalApiLimiter);

// -------------------------------------------------------------
// 3. MOUNT MODULAR SUB-ROUTERS WITH TIERED RATE LIMITERS
// -------------------------------------------------------------
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/search', searchLimiter, searchRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/admin/security', securityRouter);
app.use('/api/v3/search', searchLimiter, searchRouter);
app.use('/api/v3', searchLimiter, searchRouter);

// -------------------------------------------------------------
// 4. AI CAREER SUITE ENDPOINTS (RATE LIMITED & HARDENED)
// -------------------------------------------------------------

// PDF Upload & Text Parser (Multi-Tier: local engine + Gemini Multimodal OCR)
app.post('/api/v1/ai/parse-pdf', aiLimiter, async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    
    // Security: Validate PDF magic bytes and size
    const validation = validatePdfBase64(fileBase64, 5 * 1024 * 1024);
    if (!validation.valid) {
      recordSecurityEvent({
        event_type: 'INVALID_FILE_UPLOAD',
        severity: 'MEDIUM',
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { error_type: validation.error }
      });

      return res.status(400).json({ error: validation.error });
    }

    const safeFileName = sanitizeFileName(fileName);
    const result = await parsePdfText(validation.cleanBase64, safeFileName);

    if (!result.text || result.text.length === 0) {
      return res.status(422).json({ 
        error: 'Unable to extract readable text from this PDF. It may be an encrypted or image-only scan.',
        status: 'empty'
      });
    }

    res.json({
      status: 'success',
      fileName: safeFileName,
      extractedText: result.text,
      pageCount: result.pageCount || 1,
      source: result.source
    });
  } catch (err) {
    console.error('[PDF Parse Error]:', err.message);
    res.status(500).json({ error: 'Failed to extract text from PDF. Please verify the document is not corrupted.' });
  }
});

// AI CV & ATS Analysis
app.post('/api/v1/ai/analyze-cv', aiLimiter, async (req, res) => {
  try {
    const { cvText, fileBase64, targetRole, userProfile, employerType } = req.body;
    const analysis = await analyzeCV({ cvText, fileBase64, targetRole, userProfile, employerType });
    res.json({ status: 'success', analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI CV analysis failed: ' + err.message });
  }
});

// AI Mock Interview Coach
app.post('/api/v1/ai/interview-coach', aiLimiter, async (req, res) => {
  try {
    const { role, company, question, answer, previousScore } = req.body;
    const feedback = await generateInterviewFeedback({ role, company, question, answer, previousScore });
    res.json({ status: 'success', feedback });
  } catch (err) {
    res.status(500).json({ error: 'Interview coach evaluation failed: ' + err.message });
  }
});

// AI Career Copilot Chat
app.post('/api/v1/ai/career-copilot', aiLimiter, async (req, res) => {
  try {
    const { query, userProfile, chatHistory } = req.body;
    const reply = await handleCareerCopilot({ query, userProfile, chatHistory });
    res.json({ status: 'success', reply });
  } catch (err) {
    res.status(500).json({ error: 'Career Copilot assistance failed: ' + err.message });
  }
});

// AI & Gemini Health Status Endpoint
app.get('/api/v1/ai/status', async (req, res) => {
  try {
    const status = await getGeminiApiStatus();
    res.json({ status: 'success', ai: status });
  } catch (err) {
    res.status(500).json({ error: 'Failed retrieving AI status: ' + err.message });
  }
});

// Backward-compatible smart-search endpoint
app.post('/api/v1/ai/smart-search', searchLimiter, async (req, res) => {
  req.url = '/execute';
  searchRouter.handle(req, res);
});

// -------------------------------------------------------------
// 5. SOURCES, ADMIN & DEEP SSRF VERIFICATION
// -------------------------------------------------------------

// Real-time Link Verification & Deep DNS SSRF Defense
app.post('/api/v1/verify-link', async (req, res) => {
  try {
    const { opportunity, url } = req.body;
    const targetUrl = url || (opportunity ? generateVerifiedJobUrl(opportunity).verified_live_url : null);

    if (!targetUrl) {
      return res.status(400).json({ error: 'No URL provided for verification' });
    }

    const isSafe = await verifySafeUrlWithDns(targetUrl);
    if (!isSafe) {
      recordSecurityEvent({
        event_type: 'SSRF_BLOCKED',
        severity: 'HIGH',
        actor_ip: getSafeClientIp(req),
        request_path: req.originalUrl || req.path,
        request_method: req.method,
        details: { target_url: targetUrl }
      });

      return res.status(400).json({ 
        error: 'Blocked: URL fails SSRF safety boundary verification (private/internal/loopback subnet detected).',
        code: 'SSRF_BLOCKED'
      });
    }

    const health = await testUrlHealth(targetUrl);
    res.json({
      status: 'success',
      verified_url: targetUrl,
      is_valid: health.is_valid,
      message: health.message
    });
  } catch (err) {
    res.status(500).json({ error: 'Link verification failed' });
  }
});

// Scraper Ops Ingestion Pipeline (Admin Only)
app.post('/api/v1/admin/scrape', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const results = await runScraperPipeline();
    res.json({ status: 'success', message: 'Scraper pipeline executed successfully', results });
  } catch (err) {
    res.status(500).json({ error: 'Scraper execution error: ' + err.message });
  }
});

// Sources Registry
app.get('/api/v1/sources', (req, res) => {
  res.json({ status: 'success', total_sources: db.getSources().length, sources: db.getSources() });
});

// Legacy User Profile Sync (Protected)
app.get('/api/v1/profile', optionalAuth, (req, res) => {
  res.json({ status: 'success', profile: req.careerProfile || db.getUserProfile() });
});

app.post('/api/v1/profile', optionalAuth, (req, res) => {
  const updated = db.saveUserProfile(req.body);
  res.json({ status: 'success', profile: updated });
});

// Email Outreach Dispatch (Protected with Rate Limit)
app.post('/api/v1/email/send', emailLimiter, authenticateToken, async (req, res) => {
  const { to, subject, body, fromName } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing recipient, subject, or email body.' });
  }

  // Sanitize and validate recipient email
  const cleanTo = String(to).trim().toLowerCase();
  if (!cleanTo.includes('@') || cleanTo.length > 254) {
    return res.status(400).json({ error: 'Invalid recipient email format.' });
  }

  try {
    const result = await sendOutreachEmail({ to: cleanTo, subject, body, fromName });
    res.json({
      status: 'success',
      message: `Email successfully dispatched to ${cleanTo}`,
      messageId: result.messageId
    });
  } catch (err) {
    res.status(500).json({ error: `SMTP Dispatch Error: ${err.message}` });
  }
});

// -------------------------------------------------------------
// 6. STATIC CLIENT SERVING & SAFE FALLBACK
// -------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

// -------------------------------------------------------------
// 7. CENTRALIZED SAFE ERROR HANDLER
// -------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[Careerly Server Error]:', err.message);
  
  // CORS Error
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ error: err.message, code: 'CORS_ERROR' });
  }

  // Default Safe Production Error
  res.status(err.status || 500).json({
    error: 'An internal error occurred. Request has been safely logged.',
    code: 'SERVER_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`[API SERVER] 🛡️ Hardened Careerly SaaS API running on http://localhost:${PORT}`);
  startBackgroundScheduler(120);
});

export default app;
