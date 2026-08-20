---
name: careerly-discovery
description: Opportunity Discovery & Scraper Pipeline skill for Careerly. Use for Opportunity V4 search orchestrator, Serper Google Jobs adapter, query expansion, location normalizer, role family classification, and deduplication.
---

# Careerly Opportunity Discovery & Ingestion Skill

Maintains and expands the Opportunity V4 ingestion and search discovery engine.

## Key Files & Modules
- `server/services/discoveryOrchestrator.js` — High-throughput search coordinator.
- `server/services/locationNormalizer.js` — Deterministic city/metro precedence and country resolution.
- `server/services/queryExpander.js` — Search query matrix generator.
- `server/services/roleFamilyClassifier.js` — Strict role intent matching and filtering.
- `server/services/hardFilter.js` — Multi-constraint evaluation.
- `server/services/deduplicator.js` — Hash-based deduplication.
- `server/services/adapters/serperAdapter.js` — Google Jobs live ingestion adapter.

## Mandatory Verification Gates
```bash
node server/tests/discovery_orchestrator_tests.js
node server/tests/v3_remediation_tests.js
```
Must pass 8/8 discovery tests and 10/10 adversarial unit tests with zero regressions.
