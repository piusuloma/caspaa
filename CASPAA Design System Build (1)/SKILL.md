---
name: caspaa-design
description: Use this skill to generate well-branded interfaces and assets for CASPAA, the Edu-Fintech School Operating System for African schools — production code or throwaway prototypes, mocks, slides and marketing assets. Contains the real design tokens, the app's component stylesheet, logo SVGs, photography, icon sets, and UI kits for both the marketing site and the School OS app.
user-invocable: true
---

Read the readme.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Non-negotiables:
- **Figtree** only, 16px base / 1.5 line-height.
- **Every radius is 7px**; pills (999px) for badges, chips and avatars.
- **No navy.** Green #00B386 is the primary action, CASPAA Blue #0A8491 is the chrome, Accent Gold #E69514 is attention, Soft White #F8FAFC is the page, Light Gray #CBD5E1 borders, #1E293B text only.
- Colour lives in the content: per-module hues (--mod-*) on stat-card top rules, icon chips and sidebar icons; max two module colours per card.
- Money is `₦` with comma thousands and no decimals. Fee status is Paid / Partial / Outstanding.
- Use the two inline SVG icon sets in `components/` — never emoji, never a third-party icon font.
- No gradients in product UI. Marketing uses flat dark-teal blocks with photography beneath at 15–20% opacity.
- Link `styles.css` (which vendors the app's own stylesheet) and, for kit-fidelity work, `ui_kits/tw-config.js` after the Tailwind CDN.

Fastest starting points: `ui_kits/marketing/index.html` and `ui_kits/school_os/index.html`.
Source of truth: github.com/piusuloma/caspaa (see github.md).
