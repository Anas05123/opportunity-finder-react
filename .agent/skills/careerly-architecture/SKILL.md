---
name: careerly-architecture
description: System Architecture & API Governance skill for Careerly. Use for defining cross-module system contracts, REST API interfaces, package dependencies, and backward-compatibility rules.
---

# Careerly System Architecture & API Governance Skill

Governs system interfaces, modular boundaries, and REST API conventions across the Careerly codebase.

## Principles
1. **API Contracts**: RESTful routes conform to `/api/v1/...` with standard JSON envelopes `{ status: 'success', data: ... }`.
2. **Layer Separation**: UI components must never directly access the filesystem or SQLite database; all communication flows via the Express API.
3. **Dependency Governance**: Keep production dependencies lean and isolated from dev tooling (`package.json`).
