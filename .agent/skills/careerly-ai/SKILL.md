---
name: careerly-ai
description: AI Intelligence & Gemini LLM Integration skill for Careerly. Use for Google Gemini models, CV Studio ATS tailoring, AI Career Copilot chat, and Mock Interview Coach simulations.
---

# Careerly AI Intelligence & LLM Integration Skill

Manages all generative AI capabilities powered by Google Gemini.

## Core Modules
- `server/services/geminiAi.js` — Core LLM caller with fallback chain across `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-flash-latest`, `gemini-3.1-pro`.
- `server/services/applicationAssistant.js` — Cover letter generation & ATS resume keyword tailor.
- `src/components/CvStudio.jsx` — Interactive CV builder and scoring dashboard.
- `src/components/InterviewCoach.jsx` — Behavioral & technical interview simulation.

## Security Mandate
Wrap all untrusted job postings or candidate text in `<untrusted_job_posting>` boundaries via `server/services/textSanitizer.js` to block prompt injections.
