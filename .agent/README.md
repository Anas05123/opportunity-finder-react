# Careerly Agent Index

Start with `.agent/CONTRACT.md`. Then choose one primary agent and optional reviewers.

| Agent | Use For | Do Not Use For |
| --- | --- | --- |
| `architecture_agent` | cross-cutting design, API contracts, dependencies, ADRs | routine single-file implementation |
| `backend_agent` | Express routes, middleware, validation, API behavior | UI-only work or database schema ownership |
| `frontend_agent` | React/Vite UI, routing, client state, accessibility | backend data rules or server security |
| `ai_agent` | Gemini prompts, AI career tools, prompt safety | general backend, database, or auth changes |
| `database_agent` | SQLite schema, SQL, persistence, Supabase sync | UI layout or LLM prompts |
| `security_agent` | auth, authorization, SSRF, secrets, prompt injection, upload risk | cosmetic changes without security impact |
| `qa_agent` | test strategy, regression tests, verification scripts | production implementation |
| `devops_agent` | Render, builds, env templates, deployment checks | feature business logic |
| `discovery_agent` | opportunity ingestion, adapters, scraping, normalization, dedupe | unrelated frontend/admin UI |
| `code_review_agent` | final diff review, risk review, policy gate | implementing requested changes |

## Invocation Pattern

1. Route the task to the smallest owning agent.
2. Add `security_agent` when auth, user data, scraping, uploads, secrets, external URLs, or AI prompts are touched.
3. Add `qa_agent` when behavior changes or regression coverage is missing.
4. Add `architecture_agent` when contracts, dependencies, schema, infrastructure, or durable design decisions change.
5. End with `code_review_agent` for any code change.

## Skill Boundary

Use `.agent/skills/improve.md` for the installed shadcn/improve skill. It is audit/planning-only and must not be mixed with execution-agent behavior.
