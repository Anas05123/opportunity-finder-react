# Careerly Multi-Agent Development Spec

This file is the compatibility overview for tools that expect a single MAS document.

Authoritative shared rules live in `.agent/CONTRACT.md`. Agent routing lives in `.agent/README.md`. Current project context lives in `.ai/`.

## System Shape

```text
User request
  -> choose primary agent from .agent/README.md
  -> read shared contract and compact context
  -> inspect targeted docs/source only
  -> challenge risky proposals
  -> implement within specialist scope
  -> verify with focused tests
  -> code review gate
  -> handoff summary
```

## Agent Order

1. `architecture_agent` when the task changes design, contracts, dependencies, schema, providers, or infrastructure.
2. One execution agent for the primary subsystem: frontend, backend, AI, database, discovery, security, or devops.
3. `security_agent` for auth, admin, user data, external URLs, scraping, file uploads, prompts, or secrets.
4. `qa_agent` for regression coverage and verification.
5. `code_review_agent` for final read-only review.

## Shared Rules

- Do not duplicate broad behavior rules inside every agent. Update `.agent/CONTRACT.md` instead.
- Do not force full-suite verification for every small change; choose checks based on risk and explain skipped checks.
- Do not rely on exact historical pass counts in prompts. Test counts change.
- Do not add infrastructure without evidence, a plan, and an accepted decision.
- Do not ingest large data artifacts as documentation.

## Skill Integration

The installed shadcn/improve skill is represented in `.agent/skills/improve.md`. It is for audit and planning only. Execution agents implement plans; improve does not edit production code.
