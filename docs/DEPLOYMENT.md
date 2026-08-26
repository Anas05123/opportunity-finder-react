# Careerly DevOps & Deployment Guide

This document establishes the operational, CI/CD, and deployment architecture for Careerly (Opportunity Finder).

---

## 1. System Architecture (CURRENT)

Careerly is organized as a single-repository modular monolith:
- **Frontend**: React 19, Vite 6, React Router 7, Tailwind CSS v4, Lucide React.
- **Backend**: Node.js, Express 5, ES modules.
- **Persistence**: Embedded SQLite (`opportunity.sqlite`) via `better-sqlite3` with Write-Ahead Logging (`WAL`).
- **Cloud Sync**: Supabase client (`@supabase/supabase-js`) for remote persistence/sync scripts.
- **In Production**: Express 5 serves the pre-compiled Vite `dist/` directory as static assets with SPA fallback, alongside the `/api/v1` and `/api/v3` endpoints on the same port.

---

## 2. Development Commands (CURRENT)

| Command | Purpose |
|---|---|
| `npm install` / `npm ci` | Install dependencies deterministically from `package-lock.json` |
| `npm run dev` | Start local Vite development server on `http://localhost:5173` (proxies `/api` to port 5000) |
| `npm start` | Start production/backend Node Express server on `http://localhost:5000` |
| `npm run build` | Compile frontend React application to optimized `dist/` static bundle |
| `npm run render-build` | Automated Render build pipeline (`npm install --include=dev && npm run build`) |
| `npm run lint` | Run Oxlint fast correctness and AST static analysis across the codebase |
| `npm test` | Run full automated test suite (Routing tests + Intelligence tests + Security gate) |
| `npm run test:routing` | Execute client-side route mapping, route guards, and SPA fallback audit |
| `npm run test:opportunity` | Execute Opportunity Intelligence adapter, deduplication, and SSRF audit |
| `npm run security:gate` | Execute authoritative CI/CD security gate (dependencies, secrets, bundle, history) |

---

## 3. CI/CD Pipeline (CURRENT)

GitHub Actions workflows are located in `.github/workflows/`:

### 1. `ci.yml` — Continuous Integration Gate
- **Triggers**: Pull requests targeting `main`, pushes to `main`, `feature/**`, `fix/**`, and manual `workflow_dispatch`.
- **Pipeline Stages**:
  1. `actions/checkout@v4` with `fetch-depth: 0` (preserves full commit history for git scanner).
  2. `actions/setup-node@v4` with Node 20 and npm cache.
  3. `npm ci` — Deterministic package installation.
  4. `npm run lint` — Fast static correctness verification via Oxlint.
  5. `npm run test:routing` — 42-point client routing & navigation verification.
  6. `npm run test:opportunity` — 33-point discovery & normalization engine verification.
  7. `npm run build` — Vite production bundle compilation.
  8. `npm run security:gate` — 14-category security & supply chain audit runner.
  9. `actions/upload-artifact@v4` — Stores sanitized audit evidence JSON.

### 2. `deploy.yml` — GitHub Pages Deployment (Static Preview)
- **Triggers**: Push to `main` and `workflow_dispatch`.
- **Pipeline Stages**: Runs test and security gates prior to compiling and publishing static `dist/` to GitHub Pages.

---

## 4. Production Deployment on Render (CURRENT)

Careerly deploys as a **Web Service** on [Render](https://render.com) using Infrastructure-as-Code via `render.yaml`.

### Render Service Specifications
- **Service Name**: `opportunity-finder`
- **Runtime**: `node` (Node.js >= 20)
- **Plan**: `free`
- **Build Command**: `npm run render-build`
- **Start Command**: `npm run start`
- **Health Check Path**: `/health` (Render polls this before routing live traffic)

### Deployment Flow
```text
Developer Git Push
       ↓
GitHub Actions CI (Lint, Tests, Build, Security Gate)
       ↓
Render Webhook / Auto-Deploy Trigger
       ↓
npm run render-build (Install & Compile Vite dist/)
       ↓
npm run start (Initialize SQLite & Start Express 5)
       ↓
Render Health Check (/health returns 200 OK)
       ↓
Live Production Traffic Routed
```

---

## 5. Environment Variables & Secrets Handling (CURRENT)

Environment variables are categorized and documented in `.env.example`.

### Rules for Environment Variables
1. **Never Commit Secrets**: The `.env` file is strictly listed in `.gitignore`.
2. **Client vs Server Isolation**:
   - Variables prefixed with `VITE_` are baked into client JavaScript bundles at build time. Never store private tokens or API keys with a `VITE_` prefix.
   - Non-prefixed variables (e.g. `JWT_SECRET`, `SMTP_PASS`, `SERPER_API_KEY`) are accessible *only* within Node.js runtime.
3. **Platform Secrets**: In `render.yaml`, all sensitive credentials use `sync: false` to ensure they are configured securely in the Render Dashboard rather than stored in version control.

### Required Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `NODE_ENV` | Server | `production` or `development` |
| `PORT` | Server | HTTP port (default `5000` locally, `10000` on Render) |
| `JWT_SECRET` | Server | **Mandatory**. 32+ char secret for JWT authentication signing |
| `ADMIN_EMAIL` | Server | Primary administrator email (`ayarianas79@gmail.com`) |
| `GEMINI_API_KEY` | Server | Google Gemini API key for ATS analysis & interview coach |
| `SERPER_API_KEY` | Server | Serper.dev Google Jobs API key for live indexing |
| `SUPABASE_URL` | Server/Client | Supabase project URL |
| `SUPABASE_ANON_KEY` | Server/Client | Supabase public anonymous API key |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Server | SMTP credentials for transactional verification emails |
| `VITE_GOOGLE_CLIENT_ID` | Client | Google OAuth 2.0 Client ID for frontend sign-in |
| `VITE_SENTRY_DSN` | Client | Sentry telemetry DSN for frontend error capture |

---

## 6. Observability & Health Checks (CURRENT)

### Health Endpoints
- `GET /health` — Basic liveness probe returning `{ status: "healthy", uptime_seconds, timestamp }`. Used by Render load balancer.
- `GET /ready` (and `GET /readyz`, `GET /api/v1/ready`) — Deep readiness probe verifying SQLite database query responsiveness (`SELECT 1 as alive`). Returns HTTP 200 when ready, HTTP 503 when degraded.
- `GET /api/v1/health` — API health status including uptime, service name, and AI configuration state.

### Monitoring & Error Tracking
- **Frontend**: `@sentry/react` captures client-side uncaught exceptions with privacy filters:
  - `sendDefaultPii: false`
  - Authorization headers and cookies scrubbed
  - Session replay text masked and media blocked
  - User ID limited to opaque internal ID
- **Backend**: Express 5 error handling middleware logs to stdout.
- **Security Alerting**: `securityAlerts.js` logs critical/high security incidents to `security_events` table and optionally dispatches alerts to Slack Webhooks, custom HTTP webhooks, and email.

---

## 7. Rollback Procedures (CURRENT)

If a production deployment causes regressions:
1. **Render Dashboard Rollback**:
   - Navigate to the `opportunity-finder` service on Render.
   - Under **Events**, locate the previous successful deploy.
   - Click **Rollback to this deploy** to redeploy the previous build artifact instantly.
2. **Git Revert**:
   - Create a revert commit: `git revert <bad-commit-hash>`
   - Push to `main` branch to trigger CI validation and automatic deployment.

---

## 8. Known DevOps Limitations (CURRENT)

- **Persistent Disk on Free Tier**: Render Free Tier spins down after 15 minutes of inactivity and uses an ephemeral filesystem. On service restart, the local SQLite database is re-initialized and seeded from `opportunities_db.json`. For permanent persistence across restarts, attach a Render Persistent Disk or configure Supabase synchronization.
- **Single-Instance Deployment**: Careerly currently operates as a single instance. In-memory rate limiting and in-process cron scheduling (`startBackgroundScheduler`) run per instance.

---

## 9. Recommended Future Improvements (RECOMMENDED FUTURE)

These items are documented as potential roadmap enhancements when scaling demands:
1. **Render Persistent Disk**: Mount a persistent volume at `/var/data` to retain SQLite writes across cold restarts on paid tier.
2. **Staging Environment**: Introduce a dedicated staging service (`opportunity-finder-staging.onrender.com`) running on pull request previews.
3. **Backend Sentry Integration**: Add `@sentry/node` if distributed distributed tracing between client and API is required.
4. **Automated End-to-End Browser Testing**: Add Playwright / Cypress headless browser tests to GitHub Actions.