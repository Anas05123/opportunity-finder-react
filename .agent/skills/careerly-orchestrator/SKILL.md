---
name: careerly-orchestrator
description: Master Development Orchestrator skill for Careerly. Use for task decomposition, role routing, lock management, conflict resolution, and coordinating multi-specialist features.
---

# Careerly Master Development Orchestrator Skill

Master orchestration workflow for developing, testing, and shipping features across the Opportunity (Careerly) codebase.

## Workflow
1. **Intake & Deconstruct**: Break user requests into discrete domain subtasks.
2. **Assign Specialists**: Route work to specialized skills (`careerly-frontend`, `careerly-backend`, `careerly-discovery`, `careerly-ai`, `careerly-security`, etc.).
3. **Lock & Sequence**: Ensure only one specialist edits a file at a time.
4. **Mandatory QA Gate**: Always invoke `careerly-qa` to run all 5 regression test suites before concluding.
5. **Code Review Gate**: Run `careerly-code-review` to certify diffs and verify zero secret leaks.
