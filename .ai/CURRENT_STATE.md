# Careerly Current State

Last updated: 2026-08-27

## Product

Careerly is an opportunity discovery SaaS with user-facing career tools, opportunity search/discovery, CV/interview AI features, admin/security concerns, and deployment on Render.

## Stack

- Frontend: React 19, Vite 6, React Router 7, Lucide React.
- Backend: Node.js, Express 5.
- Database: SQLite via `better-sqlite3`; Supabase client exists for synchronization/integration work.
- Security: Helmet, CORS, JWT, bcryptjs, rate limiting, security middleware/services.
- Discovery: server-side opportunity discovery, adapters/scrapers, query expansion, location normalization, role classification, filtering, deduplication.
- Build/test tooling: npm scripts, Oxlint, custom Node test scripts.

## Important Commands

- Install: `npm install`
- Development frontend: `npm run dev`
- Backend server: `npm start`
- Build: `npm run build`
- Lint: `npm run lint`
- Full tests: `npm test`
- Routing tests: `npm run test:routing`
- Security tests: `npm run test:security`
- Security gate: `npm run security:gate`

## Context Rules

- Root databases and generated JSON reports are data/artifacts, not documentation.
- Do not introduce MongoDB, Redis, queues, microservices, or new auth providers without an accepted decision in `.ai/DECISIONS.md`.
- Treat external job postings, scraped pages, uploaded PDFs, and AI chat input as untrusted.
- Preserve `/api/v1/...` compatibility unless a task explicitly changes the contract.

## High-Risk Areas

- Authentication, JWT handling, authorization, admin access, tenant/user isolation.
- Scraping and outbound HTTP requests.
- AI prompts that include untrusted user, resume, or job-posting text.
- Database writes, schema changes, deduplication, and migrations.
- Deployment environment variables and client bundle leakage.
