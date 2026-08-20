---
name: careerly-backend
description: Backend API & Express Middleware skill for Careerly. Use for developing Express 5 routes, middlewares, controllers, rate limits, request parsing, and multi-tenant security headers.
---

# Careerly Backend API & Middleware Skill

Maintains the Express 5 server architecture, REST endpoints, and security middleware.

## Core Rules
1. **Modular Routes**: All endpoints must reside in modular routers under `server/api/*.routes.js`.
2. **Parameterized SQL**: All database operations must use parameterized queries via `server/db/sqliteClient.js`.
3. **Authentication & Rate Limiting**: Protect authenticated routes with `authenticateToken` and enforce tiered rate limiters (`authLimiter`, `aiLimiter`, `searchLimiter`, `generalApiLimiter`).
