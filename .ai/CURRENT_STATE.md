# Careerly Current State

Last updated: 2026-08-27

## Product

Careerly is an opportunity discovery SaaS with user-facing career tools, opportunity search/discovery, CV/interview AI features, admin/security concerns, and deployment on Render.

## Stack

- Frontend: React 19, Vite 6, React Router 7, Tailwind CSS v4, Lucide React.
- Backend: Node.js, Express 5.
- Database: SQLite via `better-sqlite3`; Supabase client exists for synchronization/integration work.
- Security: Helmet, CORS, JWT, bcryptjs, rate limiting, security middleware/services.
- Discovery: server-side opportunity discovery, adapters/scrapers, query expansion, location normalization, role classification, filtering, deduplication.
- Build/test tooling: npm scripts, Oxlint, custom Node test scripts.
- CI/CD & Deployment: GitHub Actions (`.github/workflows/ci.yml`, `.github/workflows/deploy.yml`), Render web service (`render.yaml`).

## Important Commands

- Install: `npm install` or `npm ci`
- Development frontend: `npm run dev`
- Backend server: `npm start`
- Build: `npm run build`
- Render build: `npm run render-build`
- Lint: `npm run lint`
- Full tests: `npm test`
- Routing tests: `npm run test:routing`
- Discovery tests: `npm run test:opportunity`
- Security tests: `npm run test:security`
- Security gate: `npm run security:gate`

## Health & Readiness Endpoints

- Liveness: `GET /health` (returns `{ status: "healthy", uptime_seconds, timestamp }`)
- Deep Readiness: `GET /ready` and `GET /api/v1/ready` (verifies SQLite database connectivity)
- Service Status: `GET /api/v1/health`

## Context Rules

- Root databases and generated JSON reports are data/artifacts, not documentation.
- Do not introduce MongoDB, Redis, queues, microservices, or new auth providers without an accepted decision in `.ai/DECISIONS.md`.
- Treat external job postings, scraped pages, uploaded PDFs, and AI chat input as untrusted.
- Preserve `/api/v1/...` compatibility unless a task explicitly changes the contract.
- Keep production secrets out of version control; use `render.yaml` with `sync: false` and `.env.example` as the canonical template.

## High-Risk Areas

- Authentication, JWT handling, authorization, admin access, tenant/user isolation.
- Scraping and outbound HTTP requests.
- AI prompts that include untrusted user, resume, or job-posting text.
- Database writes, schema changes, deduplication, and migrations.
- Deployment environment variables and client bundle leakage.