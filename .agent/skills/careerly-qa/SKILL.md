---
name: careerly-qa
description: QA & Automated Regression Testing skill for Careerly. Use for running and certifying the full test suite (Vite build, discovery orchestrator, v3 remediation unit tests, security penetration audit, and final evidence pass).
---

# Careerly QA & Regression Testing Skill

Executes and verifies all test suites across the Careerly application.

## Full Regression Test Checklist
To certify any change or release, execute the following 5 gates in order:

```bash
# 1. Frontend Bundle Build Verification
npm run build

# 2. Opportunity V4 Search & Discovery Tests (8/8)
node server/tests/discovery_orchestrator_tests.js

# 3. Adversarial Unit & Filter Tests (10/10)
node server/tests/v3_remediation_tests.js

# 4. Enterprise Security Penetration Audit (35/35, Score 100)
node test/security.test.js

# 5. Comprehensive Evidence Verification (10/10)
node test/final_verification.js
```

All 5 suites must pass with 100% before work is certified complete.
