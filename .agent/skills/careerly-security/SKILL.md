---
name: careerly-security
description: 14-Category Cybersecurity & Penetration Testing skill for Careerly. Use for SSRF defense, multi-tenant IDOR isolation, PDF magic-byte checks, prompt injection quarantine, security score verification, and dependency/secret audits.
---

# Careerly Cybersecurity & Penetration Testing Skill

Manages, enforces, and verifies the 14-category security framework across the Careerly application.

## Core Rules & Defense Gates
1. **SSRF Defense**: All external HTTP requests must route through `server/services/safeHttpClient.js` using `validateSafeUrl` and `safeFetch`.
2. **Multi-Tenant Isolation**: Enforce `authenticateToken` and tenant ownership (`req.user.id`) across all user endpoints. Cross-tenant access must return 404/403.
3. **File & PDF Validation**: All uploaded PDFs must pass `%PDF-` magic-byte checks and size limits (max 5MB) via `validatePdfBase64`.
4. **Prompt Injection Quarantine**: Wrap all untrusted text in `<untrusted_job_posting>` XML boundaries using `server/services/textSanitizer.js`.
5. **Security Score**: Maintain 100/100 score on `server/services/securityScoreEngine.js`.

## Verification Commands
```bash
node test/security.test.js
node test/final_verification.js
```
Both suites must pass with 100% (35/35 checks and 10/10 categories).
