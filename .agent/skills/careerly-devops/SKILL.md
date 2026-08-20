---
name: careerly-devops
description: DevOps & Cloud Deployment skill for Careerly. Use for Render web service configurations, environment variables, build optimizations, and asset pipelines.
---

# Careerly DevOps & Cloud Deployment Skill

Manages deployment manifests, cloud runtime environments, and build pipelines.

## Key Files
- `render.yaml` — Render Cloud service definition and environment configurations.
- `vite.config.js` — Vite bundler configuration and build optimizations.
- `.env.example` — Environment template for local and production deployments.
- `server/scripts/generateFavicon.js` — Squircle favicon and app icon asset generator.

## Production Security Rule
Never commit real API keys, JWT secrets, or connection strings into version control or client bundle artifacts.
