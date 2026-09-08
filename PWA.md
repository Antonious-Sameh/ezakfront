# PWA Implementation Notes

Same approach as Shops 1-4: installable PWA on top of the existing
React/Vite app, no offline-first behavior (this is a live reporting
dashboard — caching here is purely for load speed, never for data).

## What's cached, and what never is

- **Precached:** the built app shell (hashed JS/CSS bundles, `index.html`,
  icons) — for instant repeat loads.
- **Runtime-cached:** Google Fonts only.
- **NEVER cached:** anything under `/api/` — `NetworkOnly`, always. Every
  shop's live sales/stock/customer data must never be served stale.

## Updates

`registerType: 'prompt'` — a new service worker installs and waits; the
owner sees a dismissible toast ("يتوفر تحديث جديد للوحة التحكم") and the
update only applies when they tap "تحديث الآن" (`src/main.jsx`).

## Icons

Reused directly from System 1's `public/icons/` (same gear-glyph brand
icon set, every required PWA size + maskable variants) — no need to
regenerate; System 5 isn't a separate visual brand from the shop systems'
own icon design.

## Colors

`background_color` (#582243) matches the login page's full-screen
background; `theme_color` (#f7f2f3) matches the authenticated app shell's
light background — both pulled from this project's own `index.css`
`--primary`/`--background` tokens, not copied from System 1's palette.
