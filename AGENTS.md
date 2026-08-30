# Project Guidelines & Agent Instructions

Welcome to **Bluepen** (`outlin`). This document is the **Single Source of Truth** for AI agents (and human contributors) working in this codebase.

> [!IMPORTANT]
> **MANDATORY DIRECTIVE FOR ALL AI AGENTS**:
> Whenever you develop new features, modify existing UI, or create components, views, inspector panels, dialogs, canvas tools, or pages in this project, you **MUST STRICTLY FOLLOW the project-level `nothing-design` skill** located at:
> - **Project Skill Path**: [`.agents/skills/nothing-design/SKILL.md`](file:///e:/project/outlin/.agents/skills/nothing-design/SKILL.md)
> - **Design Documentation**: [`docs/nothing-design/SKILL.md`](file:///e:/project/outlin/docs/nothing-design/SKILL.md)
> 
> Before creating or editing any UI code, agents must reference the **`nothing-design`** skill rules and the design system summarized below.

---

## 1. Project Overview & Architecture

**Bluepen** is a fast, local-first wireframing and prototyping desktop tool for modern interfaces.

### Tech Stack
- **Desktop Shell / Backend**: [Tauri 2](https://tauri.app) + Rust backend (`apps/app/src-tauri/`)
- **Frontend Framework**: [Next.js 16](https://nextjs.org) + [React 19](https://react.dev)
- **Styling & UI Primitives**: [Tailwind CSS v4](https://tailwindcss.com) + [Base UI](https://base-ui.com)
- **Monorepo Management**: [pnpm](https://pnpm.io) workspaces

### Directory Structure
```text
outlin/
├── apps/
│   └── app/                  # Tauri shell + editor entry page (Next.js app)
│       └── src-tauri/        # Rust backend, window configuration, system capabilities
├── packages/
│   └── editor/               # Shared editor core: canvas, layers, inspector, UI kit
├── docs/
│   └── nothing-design/       # Complete design specification and reference docs
├── .agents/
│   ├── rules/                # Project agent rules (nothing-design.md)
│   └── skills/               # Project-level agent skills (nothing-design, coss, coss-particles)
├── scripts/                  # Release & synchronization scripts
└── AGENTS.md                 # Agent guidelines and design system enforcement (this file)
```

### Common Commands
```bash
pnpm install                  # Install all workspace dependencies
pnpm dev                      # Run the app in development mode with hot reload
pnpm build                    # Build release bundle
pnpm --filter app desktop:dev # Run Tauri desktop app development
pnpm --filter web dev         # Run web dev server
```

---

## 2. Mandatory Project Skill: `nothing-design`

All UI/UX development must adhere to the **`nothing-design`** skill (rooted in Nothing OS aesthetic, Swiss typography, and industrial design from Braun and Teenage Engineering).

### 2.1 Core Design Philosophy
1. **Subtract, don't add**: Every visual element must earn its pixel. Default to removing borders, boxes, and decorations.
2. **Structure is ornament**: Expose the 8px grid, monospace numeric readouts, and typographic scale rather than hiding them behind decorative styling.
3. **Monochrome is the canvas**: Color is an event, not a default. Red (`#D71921`) is reserved exclusively as a signal/warning interrupt.
4. **Type does the heavy lifting**: Scale, weight, and spacing communicate hierarchy — not colored boxes, drop shadows, or gradients.
5. **Both modes are first-class**:
   - **Dark Mode**: Deep OLED black (`#000000`), white data glowing.
   - **Light Mode**: Technical manual off-white paper (`#F5F5F5`), crisp dark ink.
6. **Industrial warmth & mechanical honesty**: Controls look like physical switches, precision dials, and instrument readouts.

---

### 2.2 Visual Hierarchy: The Three-Layer Rule

Every screen must have exactly **three layers of importance**:

| Layer | What | Typography & Style | Spacing & Position |
|---|---|---|---|
| **Primary** | The ONE hero element (key metric, headline, active tool) | `Doto` (dot-matrix) or `Space Grotesk` at display size (`--text-display`) | 48–96px breathing room, prominent placement |
| **Secondary** | Supporting context (labels, descriptions, properties) | `Space Grotesk` at body/subheading (`--text-primary`) | Grouped tight (8–16px) to primary |
| **Tertiary** | Metadata, navigation, timestamps, system info | `Space Mono` at caption/label (`--text-secondary` / `--text-disabled`), **ALL CAPS** | Pushed to edges, footers, or toolbars |

---

### 2.3 Typography Discipline & Google Fonts

**Required Google Fonts**:
- **Display**: `"Doto"` (variable dot-matrix display, 36px+ only, never for body)
- **Body / UI**: `"Space Grotesk"` (Clean, geometric sans-serif for headings and body)
- **Data / Labels**: `"Space Mono"` (Monospace, precision readouts, ALL CAPS labels)

**Screen Typographic Budget**:
- Maximum **2 font families** per screen (`Space Grotesk` + `Space Mono`; `Doto` reserved for hero moments).
- Maximum **3 font sizes** per screen (large, medium, small).
- Maximum **2 font weights** per screen (usually Regular + Medium/Light).
- **Labels**: Always `Space Mono`, **ALL CAPS**, letter spacing `0.06em–0.1em`, 11–12px size (`--label`).
- **Numbers / Data**: Always `Space Mono`. Units rendered at `--label` size, slightly raised or adjacent.

---

### 2.4 Color Tokens & Roles

#### Color Palette
| Token | Dark Mode | Light Mode | Role / Usage |
|---|---|---|---|
| `--black` / `--bg` | `#000000` | `#F5F5F5` | Primary background canvas |
| `--surface` | `#111111` | `#FFFFFF` | Elevated cards, panels, inspector backgrounds |
| `--surface-raised` | `#1A1A1A` | `#F0F0F0` | Dropdowns, hover states, secondary elevation |
| `--border` | `#222222` | `#E8E8E8` | Subtle dividers, segment separators |
| `--border-visible` | `#333333` | `#CCCCCC` | Intentional borders, wireframe outlines, inputs |
| `--text-disabled` | `#666666` | `#999999` | Disabled text, subtle hints, inactive nav |
| `--text-secondary` | `#999999` | `#666666` | Monospace ALL CAPS labels, metadata |
| `--text-primary` | `#E8E8E8` | `#1A1A1A` | Body text, standard content |
| `--text-display` | `#FFFFFF` | `#000000` | Headlines, hero numbers, active pills |

#### Accent & Status Colors
- **Accent Red (`#D71921`)**: Signal light — urgent notifications, destructive actions, critical limits, active signal dots. **At most ONE per screen as a UI element.** Never use red decoratively.
- **Success (`#4A9E5C`)**: Confirmed, completed, healthy range.
- **Warning (`#D4A843`)**: Caution, pending, caution range.
- **Interactive (`#5B9BF6` dark / `#007AFF` light)**: Tappable inline text links. Not for standard buttons.

*Note on Data Colors*: Apply status colors to the **numeric value itself**, never to row backgrounds or label text.

---

### 2.5 Spacing Scale (8px Grid)

```text
Tight (2–4px)    : Optical adjustments, icon-to-label gaps
Small (8px)      : Internal component spacing, compact gaps
Medium (16px)    : Standard padding, list item gaps
Large (24px)     : Group separation, panel padding
Extra Large (32px): Section margins
2X Large (48px)  : Major section breaks
3X Large (64px)  : Page-level vertical rhythm
4X Large (96px)  : Hero breathing room
```

**Container Strategy (Prefer top to bottom)**:
1. **Spacing alone** (Proximity groups items)
2. **Single 1px divider line**
3. **Subtle 1px border outline**
4. **Surface card with background change**

---

### 2.6 Signature Components & Code Implementation Patterns

1. **Dot-Matrix Grid**:
   ```css
   .dot-grid {
     background-image: radial-gradient(circle, var(--border-visible) 1px, transparent 1px);
     background-size: 16px 16px;
   }
   ```
2. **Buttons**:
   - **Primary**: Pill (`rounded-full`), `#FFFFFF` bg, `#000000` text, `Space Mono`, ALL CAPS.
     ```tsx
     <button className="rounded-full bg-white text-black font-mono text-xs uppercase px-5 py-2.5 tracking-wider hover:bg-neutral-200 transition-colors">
       ACTION
     </button>
     ```
   - **Secondary**: Pill (`rounded-full`), transparent bg, `1px solid --border-visible` border, `--text-primary` text.
     ```tsx
     <button className="rounded-full bg-transparent border border-neutral-700 text-neutral-200 font-mono text-xs uppercase px-5 py-2.5 tracking-wider hover:border-neutral-500 transition-colors">
       CANCEL
     </button>
     ```
   - **Destructive**: Pill (`rounded-full`), transparent bg, `1px solid #D71921` border, `#D71921` text.
   - **Ghost**: `0px` radius, transparent bg, `--text-secondary` text.
3. **Segmented Progress Bars & Controls**:
   - Discrete rectangular blocks with 2px gaps. Square-ended blocks (no border-radius on individual segments).
   - Filled = solid status color; Empty = `--border` (`#222222`) / Light (`#E0E0E0`).
4. **Instrument-Style Inputs & Controls**:
   - Underline border (`1px solid --border-visible`) or 8px technical radius.
   - Monospace `Space Mono` for numeric/data values.
   - All uppercase labels placed above inputs (`text-xs font-mono uppercase text-neutral-400`).
5. **Overlays & Dialogs**:
   - Flat `--surface` (`#111111`) bg + `1px solid --border-visible` (`#333333`) + 16px border-radius.
   - Backdrop `rgba(0,0,0,0.8)`. **No blur, no drop shadows**.
   - Close button: `[ X ]` ghost button.

---

### 2.7 Anti-Patterns (Strictly Forbidden in this Codebase)

- ❌ **NO Gradients** in UI chrome or backgrounds.
- ❌ **NO Drop Shadows or Blur Effects**. Use flat surfaces and 1px border contrast.
- ❌ **NO Skeleton Loading screens**. Use hardware-style bracket text `[LOADING...]` or segmented progress bars.
- ❌ **NO Toast Popups**. Use inline status text: `[SAVED]`, `[ERROR: ...]`.
- ❌ **NO Cute Mascots, Sad-Face Illustrations, or Emoji as UI Icons**.
- ❌ **NO Zebra Striping in tables**. Use clean 1px horizontal dividers.
- ❌ **NO Filled or Multi-Color Icons**. Use thin monoline 1.5px stroke icons (Lucide/Phosphor).
- ❌ **NO Spring or Bouncy Animations**. Use subtle ease-out (`150ms–250ms`, `cubic-bezier(0.25, 0.1, 0.25, 1)`).

---

## 3. AI Pre-Flight Checklist for UI Tasks

Before generating or modifying any UI code, verify against this checklist:
1. [ ] **Skill Consulted**: Did you read [`.agents/skills/nothing-design/SKILL.md`](file:///e:/project/outlin/.agents/skills/nothing-design/SKILL.md) / [`docs/nothing-design/SKILL.md`](file:///e:/project/outlin/docs/nothing-design/SKILL.md)?
2. [ ] **Fonts Loaded**: Are `Doto`, `Space Grotesk`, and `Space Mono` properly loaded and used according to their specific roles?
3. [ ] **Labels in ALL CAPS**: Are all metadata labels rendered in `Space Mono` with uppercase lettering and tracking?
4. [ ] **Flat Surfaces & 1px Borders**: Are all shadows, blur filters, and rounded bubble containers removed in favor of clean 1px border separation?
5. [ ] **Color Discipline**: Is `#D71921` (signal red) used at most once as a critical UI element and never decoratively?
6. [ ] **No Anti-Patterns**: Did you avoid toast popups, skeleton loaders, gradients, and spring animations?

---

## 4. Reference Documentation & Skill Files

Whenever developing or revising features, agents should consult the skill files:
- **Project Skill**: [`.agents/skills/nothing-design/SKILL.md`](file:///e:/project/outlin/.agents/skills/nothing-design/SKILL.md)
- **Design Skill Overview**: [`docs/nothing-design/SKILL.md`](file:///e:/project/outlin/docs/nothing-design/SKILL.md)
- **Tokens & Typography Reference**: [`docs/nothing-design/references/tokens.md`](file:///e:/project/outlin/docs/nothing-design/references/tokens.md)
- **Component Specifications**: [`docs/nothing-design/references/components.md`](file:///e:/project/outlin/docs/nothing-design/references/components.md)
- **Platform & Tailwind Mapping**: [`docs/nothing-design/references/platform-mapping.md`](file:///e:/project/outlin/docs/nothing-design/references/platform-mapping.md)
