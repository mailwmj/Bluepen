---
description: Project UI/UX design system rule enforcing Nothing-inspired industrial minimal aesthetic across all frontend files.
always_on: true
---

# Rule: Nothing UI/UX Design System Enforcement

All UI components, canvas tools, inspector controls, dialogs, overlays, and frontend views in this repository must strictly adhere to the Nothing Design System (`docs/nothing-design/` and `.agents/skills/nothing-design/`).

## Mandatory Requirements
1. **Typography**:
   - Display: `"Doto"` (variable dot-matrix, 36px+ hero moments only)
   - Body & Headings: `"Space Grotesk"` (clean geometric sans-serif)
   - Data & Labels: `"Space Mono"` (monospace precision, ALL CAPS for labels)
   - Screen Budget: Max 2 font families, max 3 font sizes, max 2 font weights per screen.

2. **Monochrome Palette**:
   - Dark Mode: OLED Canvas `#000000`, Surface `#111111`, Raised `#1A1A1A`, Border `#222222`, Border Visible `#333333`.
   - Light Mode: Paper Canvas `#F5F5F5`, Surface `#FFFFFF`, Raised `#F0F0F0`, Border `#E8E8E8`, Border Visible `#CCCCCC`.
   - Text: Display `#FFFFFF`/`#000000`, Primary `#E8E8E8`/`#1A1A1A`, Secondary `#999999`/`#666666`, Disabled `#666666`/`#999999`.

3. **Accent & Status Colors**:
   - Signal Red: `#D71921` — at most ONE per screen as a UI element. Never used decoratively.
   - Status: Success `#4A9E5C`, Warning `#D4A843`, Interactive `#5B9BF6` (dark) / `#007AFF` (light).
   - Apply status colors directly to the numeric value, never to backgrounds or labels.

4. **Visual Hierarchy (Three-Layer Rule)**:
   - Primary: ONE hero element (`--text-display`, 48-96px breathing room).
   - Secondary: Supporting context (`Space Grotesk`, `--text-primary`, grouped tight 8-16px).
   - Tertiary: Metadata/labels (`Space Mono`, ALL CAPS, `--text-secondary`, pushed to edges).

5. **Signature Elements & Components**:
   - Dot-matrix backgrounds: `.dot-grid` (radial gradient 1px dots with 16px step).
   - Buttons: Pill shape (`rounded-full`) or technical (4-8px), Space Mono ALL CAPS.
   - Segmented progress bars: Discrete rectangular blocks with 2px gaps, square ends, no border-radius.
   - Modals & dialogs: Flat `--surface` background, `1px solid --border-visible`, no drop shadows, no blur.

6. **Anti-Patterns (Strictly Prohibited)**:
   - ❌ NO Gradients in UI chrome or backgrounds.
   - ❌ NO Drop Shadows or blur effects (use 1px borders and surface contrast).
   - ❌ NO Skeleton loaders (use `[LOADING...]` bracket text or segmented indicators).
   - ❌ NO Toast popups (use inline status: `[SAVED]`, `[ERROR: ...]`).
   - ❌ NO Cute mascots, emojis as UI icons, or multi-color icons.
   - ❌ NO Zebra striping in tables.
   - ❌ NO Spring or bouncy easing (use subtle ease-out 150-250ms).
