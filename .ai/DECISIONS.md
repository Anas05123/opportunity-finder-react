# Careerly Decisions

Record durable architecture decisions here. New agents must check this file before adding infrastructure or changing major contracts.

## ADR-001: Keep Current Modular Monolith

Status: Accepted

Careerly currently runs as a React/Vite frontend with a Node/Express backend in one repository. Do not introduce microservices unless a concrete scaling, ownership, deployment, or reliability requirement justifies the operational cost.

## ADR-002: SQLite Is The Current Primary Local Database

Status: Accepted

Use the existing SQLite/better-sqlite3 persistence model unless a proven requirement demands a migration. External source variability should be handled through canonical models and source metadata before proposing another database.

## ADR-003: Use Existing Security Middleware By Default

Status: Accepted

Security-sensitive changes must extend existing validation, auth, safe HTTP, sanitizer, rate limit, and security test patterns before introducing new security frameworks.

## ADR-004: Plans Before Large Infrastructure

Status: Accepted

Queues, Redis, new hosting, new auth providers, new databases, and major AI provider changes require an architecture plan and explicit approval before implementation.
