---
name: careerly-frontend
description: Frontend Engineering & UI/UX Design skill for Careerly. Use for developing React 19 views, Lucide icons, glassmorphism CSS, ambient glow backdrops, drawers, modals, and dark/light theme switching.
---

# Careerly Frontend & UI/UX Design Skill

Builds, refines, and maintains the modern React 19 user interface for Careerly.

## Design Guidelines & Standards
1. **Glassmorphism & Theme Switching**: Utilize CSS variables (`--bg-primary`, `--glass-bg`, `--accent-blue`) to ensure seamless light and dark mode responsiveness.
2. **Component Modularity**: Partition UI logic into dedicated folders under `src/components/` (e.g., `SearchInterface/`, `OpportunityCard/`, `CvStudio/`, `Dashboard/`, `Auth/`).
3. **Clean Code**: Enforce 100% React Hook dependency compliance and zero unused variables.

## Verification Command
```bash
npm run build
```
Must compile the production bundle with Vite in under 5 seconds with zero syntax errors.
