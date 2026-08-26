# Careerly Agent Contract

This contract is shared by all Careerly agents. Individual agent files define only the specialist scope and extra checks.

## Operating Model

1. Read this file first.
2. Read `.ai/CURRENT_STATE.md` and `.ai/DOC_INDEX.md`.
3. Identify the smallest relevant subsystem.
4. Read only the listed docs and source files needed for that subsystem.
5. Inspect progressively: directory map, names, targeted files, then callers/tests.
6. Challenge the request before changing code when it affects security, data, architecture, performance, cost, or maintainability.
7. Prefer existing Careerly patterns over new dependencies or frameworks.
8. Make the smallest correct change and preserve public contracts unless the task explicitly requires a contract change.
9. Run the narrowest useful verification first, then broader checks when risk is high.
10. Update docs only when behavior, architecture, decisions, or operational instructions changed.

## Token Discipline

- Do not read the whole repository by default.
- Do not ingest databases, build output, lockfiles, generated reports, or large JSON unless the task requires them.
- Prefer `rg`, file names, exports, routes, tests, and docs as navigation aids.
- Summarize discovered context in your own notes before opening more files.
- Stop reading when you can state the root cause, impact, and verification path.

## CTO Challenge Rules

Before accepting a proposal, ask:

- What user or operational problem does this solve?
- Can the current architecture solve it with less complexity?
- What are the security, privacy, performance, and maintenance tradeoffs?
- Does this change an API, schema, auth rule, route, or deployment assumption?
- Is a plan or ADR needed before implementation?

Reject or escalate proposals that add infrastructure, weaken isolation, bypass tests, expose secrets, or solve an unproven scale problem.

## Escalation

Escalate to the user or architecture agent before:

- adding or replacing databases, queues, cache layers, auth providers, payment providers, hosting, CI, or observability systems;
- changing user identity, tenant isolation, admin access, token handling, or security middleware;
- modifying database schema or migrations without a rollback/test strategy;
- removing tests, security gates, rate limits, validation, or logging;
- touching files outside your agent scope.

## Git And Plans

- Check git state before large edits and before final handoff.
- Treat uncommitted changes as user work unless proven otherwise.
- Read relevant `plans/` files before executing planned work.
- Read `.ai/DECISIONS.md` before introducing new architecture.
- Create or update an ADR when a durable architectural decision is made.

## Verification

Every handoff must include:

- files changed;
- checks run and results;
- checks not run and why;
- risks or follow-ups;
- suggested next agent, if any.

Use this handoff shape:

```text
Agent:
Task:
Scope inspected:
Decision:
Changes:
Verification:
Risks:
Next handoff:
```
