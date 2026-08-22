# CAREERLY PRODUCT DESIGN SYSTEM — MASTER SPECIFICATION

> **Single Source of Truth** for the complete Careerly UI/UX Redesign.
> Inspired by the design principles of **Linear, Stripe, Vercel, Notion, Attio, and Ramp**.
> Calibrated with **UI/UX Pro Max Intelligence**.

---

## 1. Product Design Philosophy

Careerly is a professional career intelligence and productivity platform built for ambitious candidates, students, and scholars.

### Core Tenets:
1. **5-Second Clarity**: Every view instantly answers: *Where am I? What should I do next? What matters most? What can I click? What is the status?*
2. **Restraint Over Decoration**: Zero unnecessary gradients, zero neon purple AI clichés, zero giant floating blobs. AI is a quiet, reliable workflow utility, not a decorative mascot.
3. **Information Density with Breathing Room**: High scannability, structured tables and cards, consistent micro-spacing, and progressive disclosure.
4. **Purposeful Semantic Color**: Monochromatic foundation (Obsidian Dark / Crisp Slate Light) with precise semantic signals (Emerald for high-match & verification, Cobalt for primary actions, Amber for deadlines, Rose for danger).
5. **Universal Accessibility**: Minimum 4.5:1 contrast, 40–44px touch targets, visible focus rings, keyboard navigation (`Enter`, `Space`, `Escape`, `/`, `Cmd+K`), and reduced-motion compliance.

---

## 2. Color System & Design Tokens

### Dark Mode (Obsidian Precision) — Default
| Role | Token | Hex / RGBA | Usage |
| :--- | :--- | :--- | :--- |
| **App Canvas** | `--bg-app` | `#08090C` | Deep neutral background canvas |
| **Surface (Card/Sidebar)**| `--bg-surface` | `#0F1117` | Cards, sidebars, modals |
| **Elevated Surface** | `--bg-surface-elevated` | `#161922` | Hover states, inputs, nested containers |
| **Subtle Border** | `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Dividers, internal table lines |
| **Default Border** | `--border-default` | `rgba(255, 255, 255, 0.12)` | Card borders, inputs, modals |
| **Active / Focus Border** | `--border-focus` | `#10B981` | Focused inputs, active selections |
| **Primary Text** | `--text-primary` | `#F8FAFC` | Headings, main labels, values |
| **Secondary Text** | `--text-secondary` | `#94A3B8` | Subtitles, helper text, table content |
| **Muted Text** | `--text-muted` | `#64748B` | Timestamps, placeholders, tags |

### Light Mode (Porcelain Clarity)
| Role | Token | Hex / RGBA | Usage |
| :--- | :--- | :--- | :--- |
| **App Canvas** | `--bg-app` | `#F8FAFC` | Light neutral canvas |
| **Surface (Card/Sidebar)**| `--bg-surface` | `#FFFFFF` | Cards, sidebars, modals |
| **Elevated Surface** | `--bg-surface-elevated` | `#F1F5F9` | Hover states, inputs, nested containers |
| **Subtle Border** | `--border-subtle` | `#E2E8F0` | Dividers, internal lines |
| **Default Border** | `--border-default` | `#CBD5E1` | Card borders, inputs |
| **Active / Focus Border** | `--border-focus` | `#059669` | Focused inputs, active selections |
| **Primary Text** | `--text-primary` | `#0F172A` | Headings, main labels |
| **Secondary Text** | `--text-secondary` | `#475569` | Body text, descriptions |
| **Muted Text** | `--text-muted` | `#64748B` | Helper text, secondary meta |

### Semantic Accent Tokens
- **Primary Brand / Action**: `#10B981` (Emerald) — Dark: `#10B981`, Light: `#059669`
- **Secondary Action / Links**: `#3B82F6` (Cobalt) — Dark: `#38BDF8`, Light: `#2563EB`
- **Warning / Deadlines**: `#F59E0B` (Amber) — Dark: `#FBBF24`, Light: `#D97706`
- **Danger / Deletion**: `#EF4444` (Rose) — Dark: `#F87171`, Light: `#DC2626`
- **Purple / Tools**: `#8B5CF6` (Violet) — Dark: `#A78BFA`, Light: `#7C3AED`

---

## 3. Typography Scale & Hierarchy

- **Primary Font Family**: `Plus Jakarta Sans`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Family**: `JetBrains Mono`, `monospace` (Used for codes, scores, timestamps, IDs)

| Style Name | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 32px / 2.0rem | 1.15 | 800 | -0.03em | Landing hero title, main statistics |
| **Page Title** | 24px / 1.5rem | 1.25 | 700 | -0.02em | Screen header titles (`Dashboard`, `Opportunities`) |
| **Section Title**| 18px / 1.125rem | 1.35 | 700 | -0.01em | Card section headers, drawer titles |
| **Card Title** | 15px / 0.9375rem| 1.40 | 600 | 0.00em | Opportunity role title, metric card titles |
| **Body (Default)**| 14px / 0.875rem | 1.50 | 400 / 500 | 0.00em | Standard text, descriptions, details |
| **Secondary / Meta**| 13px / 0.8125rem| 1.45 | 500 | 0.00em | Company meta, location, dates, tags |
| **Micro / Tag** | 11px / 0.6875rem| 1.30 | 700 | 0.04em | Badges, status pills, category chips |

---

## 4. Spacing, Radii & Shadow Tokens

### Spacing Scale
- `--space-xs`: `4px` (Tight gaps, icon margins)
- `--space-sm`: `8px` (Button gaps, chip padding)
- `--space-md`: `16px` (Card padding, form field gaps)
- `--space-lg`: `24px` (Section padding, container margins)
- `--space-xl`: `32px` (View layout padding)
- `--space-2xl`: `48px` (Page section spacing)

### Radii Hierarchy
- `--radius-sm`: `6px` (Tags, chips, small buttons)
- `--radius-md`: `10px` (Inputs, standard buttons, pills)
- `--radius-lg`: `14px` (Standard cards, modals, table containers)
- `--radius-xl`: `18px` (Hero cards, primary panels, drawers)
- `--radius-full`: `9999px` (Badges, avatars, circular controls)

### Shadows
- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 4px 12px -1px rgba(0,0,0,0.1), 0 2px 6px -1px rgba(0,0,0,0.06)`
- `--shadow-lg`: `0 12px 28px -4px rgba(0,0,0,0.18), 0 4px 12px -2px rgba(0,0,0,0.08)`
- `--shadow-xl`: `0 24px 48px -12px rgba(0,0,0,0.25)`

---

## 5. Iconography System

- **Icon Set**: `Lucide React` (Single unified SVG library across entire product).
- **Navigation Icons**: `20px` (Stroke width `1.75px`)
- **Action Icons**: `16px – 18px` (Stroke width `2.0px`)
- **Utility / Status Icons**: `14px – 16px` (Stroke width `2.0px`)
- **Touch Target**: Minimum `40px × 40px` interactive hit area on all icon buttons.

---

## 6. Information Architecture & Navigation

```
CAREERLY APP SHELL
├── Top SaaS Header
│   ├── Mobile Hamburger Menu Trigger
│   ├── Dynamic Breadcrumb Trail (e.g. Workspace / Opportunities / High Match)
│   ├── Global Search Trigger (`/` or `Cmd+K`)
│   ├── Real-time Notification Bell
│   └── Profile & Theme Switcher Action
│
├── Collapsible Sidebar
│   ├── Brand Header (`Careerly` + Verified Intelligence Badge)
│   ├── WORKSPACE Group
│   │   ├── Overview (Dashboard)
│   │   ├── Opportunities Explorer (Search, Filter, Grid/List)
│   │   ├── Saved Vault (Bookmarks)
│   │   ├── Applications CRM (Kanban Pipeline)
│   │   └── Deadlines (Calendar & Timeline)
│   ├── CAREER TOOLS Group
│   │   ├── AI CV Studio & ATS Scorer
│   │   ├── Mock Interview Coach
│   │   └── 24/7 Career Copilot
│   ├── ACCOUNT Group
│   │   ├── Career Profile
│   │   └── Account Settings
│   └── User Footer Pill (Avatar, Name, Email, Theme toggle, Logout)
│
└── Main Canvas
    └── View Content with Responsive Layout & Progressive Disclosure
```

---

## 7. Component Specifications

### 1. Primary Action Button (`.btn-primary` / `.btn-emerald`)
- Height: `38px` (standard) / `44px` (hero / mobile)
- Padding: `0 1.25rem`
- Border Radius: `var(--radius-md)`
- Background: Solid Emerald (`#10B981` dark / `#059669` light)
- Font: `13px`, Weight `600`
- Transition: `all 150ms ease`
- States: Hover (`brightness(1.08)`, `translateY(-1px)`), Active (`translateY(0)`), Focus (`box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35)`).

### 2. Secondary Outline Button (`.btn-outline` / `.btn-secondary`)
- Height: `38px`
- Padding: `0 1.15rem`
- Border: `1px solid var(--border-default)`
- Background: `var(--bg-surface)`
- Font: `13px`, Weight `600`, Color: `var(--text-primary)`
- Hover: Border `var(--border-focus)`, Background `var(--bg-surface-elevated)`

### 3. Opportunity Card (`.opportunity-card-modern`)
- Padding: `1.25rem`
- Border: `1px solid var(--border-default)`
- Background: `var(--bg-surface)`
- Top Row: Company Avatar + Company Name + City/Country + Match Score Pill
- Middle Row: Opportunity Title + Type Tag + Compensation Pill + English Waiver Pill
- Bottom Row: Urgency Countdown + "Apply Kit" Primary CTA + "Save" Bookmark

### 4. Kanban CRM Board (`.crm-kanban-board`)
- Columns: `Saved`, `Preparing`, `Applied`, `Interview`, `Offer`, `Rejected`
- Header: Stage Title + Total Count Badge + Color Dot Indicator
- Cards: Drag-ready, compact, displaying role title, company name, deadline, and next stage trigger button.

### 5. Drawer System (`.app-drawer-panel`)
- Width: `560px` (desktop) / `100%` (mobile `<= 640px`)
- Backdrop: `rgba(0, 0, 0, 0.65)` with `backdrop-filter: blur(8px)`
- Header: Sticky title + close icon button + status badge
- Body: Tabbed navigation (`Overview`, `Requirements`, `AI Application Kit`, `Evidence Records`)
- Footer: Sticky primary action bar ("Apply on Verified Portal" + "Save to CRM").

---

## 8. Verification & Delivery Standard

All UI screens must pass:
1. `npm run build` with 0 warnings/errors.
2. `node test/routing.test.js` (27/27 checks passed).
3. `node test/adversarial_security.test.js` (125/125 checks passed).
4. `node test/user_journey_acceptance.test.js` (39/39 checks passed).
5. Zero horizontal overflow at `375px`, `768px`, `1024px`, and `1440px`.
