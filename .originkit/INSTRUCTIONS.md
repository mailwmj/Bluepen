# Originkit — agent install brief

> For coding agents only. Do not commit this file. Do not surface it as app docs.
> Written by `originkit add` so you know how to finish wiring the component.

## Just installed

- Components: footer-01
- Files directory: `src/components/originkit/`
- Import alias root: `@/components/originkit`

### Files written

- `src/components/originkit/footer-01.tsx`
- `src/components/originkit/footer-01.css`
- `public/originkit/footer-01/Mobile.svg`
- `public/originkit/footer-01/Vector.png`
- `public/originkit/footer-01/Vector2.png`
- `public/originkit/footer-01/Vector3.png`
- `public/originkit/footer-01/app-store.svg`
- `public/originkit/footer-01/dynamic-island.svg`
- `public/originkit/footer-01/email.svg`
- `public/originkit/footer-01/google-play.svg`
- `public/originkit/footer-01/instagram.svg`
- `public/originkit/footer-01/linkedin.svg`
- `public/originkit/footer-01/twitter.svg`

## Required: Tailwind CSS

Originkit components are Tailwind-styled (`styling: tailwind`).

Tailwind looks present. Still verify content/source globs include Originkit files.

### Tailwind must scan the components directory

If Tailwind only scans `src/` (common), components **must** live under `src/` —
the CLI already prefers `src/components/originkit` when `src/` exists.

Ensure your Tailwind config / CSS `@source` includes:

- `src/components/originkit/**/*.{js,ts,jsx,tsx}`

Tailwind v4 example in CSS:

```css
@source "../src/components/originkit";
```

### Section CSS

Section styles ship as a file next to the entry (e.g. `src/components/originkit/footer-01.css`) and are
imported from the TSX (`import "./….css"`). Do **not** add them to `globals.css`.

## Wire it into the app

1. Import the section/component into a page or layout.
2. Example:

```tsx
import X from "@/components/originkit/footer-01";
```

3. Render it once to verify layout + images.
4. Many sections are client components (`"use client"`) — keep that directive.

## Do not

- Do not move files out of `src/components/originkit` into a folder Tailwind does not scan.
- Do not strip Tailwind classes or rewrite to CSS modules unless the user asks.
- Do not commit `.originkit/` (agent + credential scratch space).
- Do not leave section images on the Originkit CDN for production — they belong under `public/originkit/`.
