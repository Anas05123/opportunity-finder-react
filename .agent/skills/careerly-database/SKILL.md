---
name: careerly-database
description: Database Architecture & Cloud Sync skill for Careerly. Use for SQLite relational schemas, indexes, better-sqlite3 queries, migrations, and Supabase PostgreSQL synchronization.
---

# Careerly Database Architecture & Cloud Sync Skill

Manages relational schemas, local SQLite caching, and Supabase cloud synchronization.

## Key Files
- `server/db/sqliteClient.js` — SQLite database connection and schema initialization.
- `server/services/supabaseClient.js` — Supabase cloud PostgreSQL client.
- `server/scripts/syncToSupabase.js` — Sync runner between local SQLite and cloud PostgreSQL.
- `opportunity.sqlite` — Local SQLite production database.

## Rules
- Enforce foreign keys and indexed lookups on all high-traffic tables (`opportunities`, `users`, `applications`, `security_events`).
- Always use parameterized statements to eliminate SQL injection vectors.
