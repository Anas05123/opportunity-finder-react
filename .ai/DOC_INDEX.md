# Careerly Documentation Index

Use this file to choose the smallest context set.

| Task Area | Read First | Then Inspect |
| --- | --- | --- |
| Any task | `.agent/CONTRACT.md`, `.ai/CURRENT_STATE.md` | relevant agent file |
| Architecture/dependencies | `.ai/DECISIONS.md`, `.agent/agents/architecture_agent.md` | `package.json`, configs, relevant source |
| Frontend/routing/UI | `.agent/agents/frontend_agent.md` | `src/**`, `public/**`, route tests |
| Backend/API | `.agent/agents/backend_agent.md` | `server/index.js`, `server/api/**`, middleware/tests |
| Auth/security | `.agent/agents/security_agent.md` | auth middleware, security services, security tests |
| Database/schema | `.agent/agents/database_agent.md` | `server/db/**`, SQL callers, sync scripts |
| Discovery/scraping | `.agent/agents/discovery_agent.md` | discovery services, adapters, scrapers, tests |
| AI features | `.agent/agents/ai_agent.md` | AI services and AI-facing components |
| Deployment/build | `.agent/agents/devops_agent.md` | `render.yaml`, `vite.config.js`, `.env.example`, build scripts |
| Tests/verification | `.agent/agents/qa_agent.md` | `test/**`, `server/tests/**`, package scripts |
| Audit/planning | `.agent/skills/improve.md` | `plans/**`, docs, targeted source |

## Planned Documentation Layer

Create these docs when the related subsystem changes enough to justify durable documentation:

- `docs/ARCHITECTURE.md`
- `docs/AUTH.md`
- `docs/API.md`
- `docs/DATABASE.md`
- `docs/OPPORTUNITIES.md`
- `docs/SCRAPING.md`
- `docs/AI.md`
- `docs/SECURITY.md`
- `docs/DEPLOYMENT.md`
- `docs/OBSERVABILITY.md`
