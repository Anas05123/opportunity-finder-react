# CAREERLY DEVELOPMENT MULTI-AGENT SYSTEM (MAS) SPECIFICATION

## 1. Overview & Objective
This multi-agent architecture defines a dedicated team of **Development Subagents** for designing, building, testing, securing, and maintaining the Opportunity (Careerly) platform.

These are **autonomous development specialists** used by developers and the Development Orchestrator to execute codebase enhancements while strictly enforcing:
1. Zero unnecessary overwrites of working functionality.
2. Mandatory execution of all regression suites (`discovery_orchestrator_tests.js`, `v3_remediation_tests.js`, `security.test.js`, `final_verification.js`, `npm run build`).
3. Preservation of all 14 completed cybersecurity phases and existing Opportunity V4 discovery engine behaviors.

---

## 2. Agent Registry & Responsibility Matrix

```
                               ┌─────────────────────────────┐
                               │  Development Orchestrator   │
                               │  (Task Decomp & Lock Mgr)   │
                               └──────────────┬──────────────┘
                                              │
       ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┬──────────────┐
       │              │              │        │              │              │              │
 ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  │  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
 │Architect  │  │Frontend   │  │Backend/API│  │  │Discovery  │  │AI Intel   │  │Database   │  │Security   │
 │Specialist │  │UI-UX Spec │  │Specialist │  │  │Specialist │  │Specialist │  │& Sync Spec│  │Specialist │
 └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
       │              │              │        │        │              │              │              │
       └──────────────┴──────────────┴────────┼────────┴──────────────┴──────────────┴──────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  DevOps & Deploy  │
                                    └─────────┬─────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │  QA & Regression  │
                                    │  Testing Suite    │
                                    └─────────┬─────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │Code Review & Gate │
                                    └───────────────────┘
```

| Agent Name | Core Responsibility | Allowed Write Scope | Forbidden Scope (Read-Only) | Primary Regression Gate |
|---|---|---|---|---|
| **Development Orchestrator** | Task decomposition, role assignment, lock management | `.agent/`, `prompt_draft.md`, `implementation_plan.md`, `walkthrough.md` | Source code files (`src/**`, `server/**`) | System workflow integrity |
| **Architecture Specialist** | System design, REST API contracts, package governance | `package.json`, `.oxlintrc.json`, API contract specs | UI views, specific business logic | Contract schema checks |
| **Frontend / UI-UX Specialist** | React 19 UI views, Lucide icons, glassmorphism CSS, theme system | `src/**`, `public/**`, `index.html` | `server/**`, `opportunity.sqlite`, `test/**` | `npm run build`, `oxlint` |
| **Backend / API Specialist** | Express 5 routes, middlewares, controllers, rate limits | `server/index.js`, `server/api/**`, `server/middleware/**` | `server/services/security/**`, `server/services/adapters/**`, `src/**` | API routing and status tests |
| **Discovery Specialist** | Scrapers, Serper Google Jobs adapter, normalizers, deduplication | `server/services/discoveryOrchestrator.js`, `server/services/adapters/**`, `server/services/scrapers/**`, `server/services/locationNormalizer.js`, `server/services/queryExpander.js`, `server/services/roleFamilyClassifier.js`, `server/services/hardFilter.js`, `server/services/deduplicator.js`, `auto_fetcher.py` | `src/**`, `server/middleware/auth.js`, `server/services/security/**` | `discovery_orchestrator_tests.js` (8/8) & `v3_remediation_tests.js` |
| **AI Intelligence Specialist** | Google Gemini integrations, CV Studio ATS tailoring, Copilot, Interview Coach | `server/services/geminiAi.js`, `server/services/applicationAssistant.js`, `src/components/CvStudio.jsx`, `src/components/InterviewCoach.jsx`, `src/components/AiCareerCopilot.jsx` | `server/middleware/security.js`, `server/db/**`, `test/security.test.js` | Untrusted XML prompt injection tests |
| **Database & Sync Specialist** | SQLite schemas, indexes, `better-sqlite3` queries, Supabase cloud sync | `server/db/**`, `server/services/supabaseClient.js`, `server/scripts/syncToSupabase.js` | `src/components/**`, `server/services/geminiAi.js` | Schema integrity & migration checks |
| **Security Specialist** | 14-category security framework, SSRF protection, multi-tenant isolation, scanners | `server/services/security/**`, `server/services/securityAuditRunner.js`, `server/services/securityScoreEngine.js`, `server/services/safeHttpClient.js`, `server/services/textSanitizer.js`, `server/middleware/security.js`, `test/security.test.js`, `test/final_verification.js` | `src/**` (except security UI), `server/services/adapters/**` | `security.test.js` (35/35) & `final_verification.js` |
| **DevOps & Deployment Specialist** | Render deployment configs, Vite build optimization, environment templates | `render.yaml`, `vite.config.js`, `.env.example`, `server/scripts/generateFavicon.js` | Core backend routes, database schema | Vite production build, bundle audit |
| **QA & Testing Specialist** | Test runner execution, unit & adversarial tests, regression verification | `test/**`, `server/tests/**` | Production business logic (`src/**`, `server/services/**`) | Executes all 5 test suites |
| **Code Review Gatekeeper** | Oxlint validation, security diff inspection, anti-pattern detection | Review feedback only (read-only on source) | All production files | Zero lint errors, zero hardcoded secrets |

---

## 3. Communication & Execution Lifecycle

```
[Phase 1: Task Intake & Deconstruction]
  User Request ➡️ Orchestrator analyzes task ➡️ Architecture Specialist issues API spec
                                                      ⬇️
[Phase 2: Domain Implementation]
  Orchestrator acquires file locks ➡️ Assigned Specialist modifies designated files
                                                      ⬇️
[Phase 3: QA Verification Gate]
  QA Specialist runs full test suite (Build, Discovery, Adversarial, Penetration, Evidence)
    ├─ If FAILS ➡️ Routes failure trace back to implementing specialist
    └─ If PASSES ➡️ Advances to Code Review
                                                      ⬇️
[Phase 4: Code Review & Delivery]
  Code Review Agent verifies diff & lint ➡️ Orchestrator compiles walkthrough ➡️ User Delivery
```

---

## 4. Conflict Prevention & File Locking Protocol

1. **Explicit File Locking:** Only one agent may hold a write lock on a specific file path at any time.
2. **Component Isolation:** UI features are partitioned into modular subdirectories (e.g., `src/components/CvStudio/`, `src/components/SearchInterface/`) rather than monolithic edits in `App.jsx`.
3. **Sequential Coordination:** When shared entry points (`App.jsx`, `server/index.js`) require changes from multiple domains, the Orchestrator sequences the modifications and runs intermediate diffs.
