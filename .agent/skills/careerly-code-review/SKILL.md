---
name: careerly-code-review
description: Code Review & Quality Gatekeeper skill for Careerly. Use for auditing git diffs, static analysis, Oxlint verification, anti-pattern detection, and secret leak defense.
---

# Careerly Code Review & Quality Gatekeeper Skill

Performs read-only static analysis and diff auditing before completing tasks or merging changes.

## Review Audit Checklist
1. **Oxlint Compliance**: Ensure zero lint errors, zero missing React hook dependencies, and zero unused variables.
2. **Regression Risks**: Verify that existing working code, tests, and comments were preserved.
3. **Secret Security**: Confirm no raw tokens, passwords, or keys were added to source files.
4. **Error Handling**: Verify that try/catch blocks handle errors gracefully without crashing the server.
