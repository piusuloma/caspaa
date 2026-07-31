# Getting CASPAA into Figma

Everything here is plain HTML/CSS/JSON, so it moves into Figma with two free
plugins — no manual redrawing. Do the tokens first, then the screens.

**The colour system in these files is the brand-guide palette:** CASPAA Green
`#00B386` (primary action), CASPAA Blue `#0A8491` (chrome), Accent Gold `#E69514`
(attention), Soft White `#F8FAFC`, Light Gray `#CBD5E1`, Dark Gray `#1E293B`
(text only), plus eight `module` hues. **There is no navy.**

---

## 1. Tokens → Figma variables (about 5 minutes)

File: **`figma/caspaa.tokens.json`** — W3C Design Tokens / Tokens Studio format.

1. Figma → **Plugins → Browse** → install **Tokens Studio for Figma**.
2. Run it → ☰ menu → **Load from file/folder** (or *Import → JSON*) → choose
   `caspaa.tokens.json`.
3. The `caspaa` set appears with `color`, `font`, `space`, `layout`, `radius`,
   `shadow`. Select it → **Apply to document**.
4. *Settings → Export to Figma variables* creates native variable collections.
   Aliases like `{caspaa.color.accent.600}` stay linked, so
   `semantic.actionPrimary` follows the green if you ever retune it.
5. `font.style.*` import as **text styles**; `shadow.*` as **effect styles**.

Names map 1:1 to the CSS:

| Figma | CSS | Job |
|---|---|---|
| `caspaa.color.accent.600` | `--accent-600` | Primary action (green) |
| `caspaa.color.brand.600` | `--brand-600` | Chrome (teal) |
| `caspaa.color.gold.500` | `--gold-500` | Attention (gold) |
| `caspaa.color.module.fees` | `--mod-fees` | Module hue + its `…Soft` wash |
| `caspaa.radius.md` | `--r-md` | 7px — every radius |

### Suggested variable modes
Keep one mode. The system has no dark theme: dark surfaces are `brand.800`
(`#06545d`) panels inside a light page, not a separate scheme.

---

## 2. Screens & components → Figma frames

Use **html.to.design** (free tier is enough).

1. Serve the project over HTTP (any static server — the pages load Tailwind's Play
   CDN, and it must run before capture; a bare file upload will lose the utility
   classes).
2. In Figma run **html.to.design** → *URL* tab → paste, one at a time:
   - `ui_kits/school_os/index.html` — the app: sidebar, topbar, dashboard, invoices,
     payments, reconciliation, record-payment modal
   - `ui_kits/marketing/index.html` — the full home page
   - `components/app/app.card.html` and `components/marketing/marketing.card.html`
     — the primitive sheets
   - each `guidelines/*.html` — the foundation specimens
3. Import with **"Layers as auto layout"** on. Text stays editable; the logo SVGs
   come in as vectors.
4. Re-link colour: select a frame → *Selection colors* → swap each hex for the
   matching variable from step 1.

### Before you import
- Install **Figtree** (Google Fonts) or enable it in Figma's font picker, or text
  metrics will shift.
- Capture the app kit at **1440×900** and the marketing page at **1440** wide —
  both are responsive and will otherwise import in their mobile layout.
- Interactive states (hover, active nav, open tabs) capture in their default state.
  Trigger the state in the browser first, or rebuild them as Figma variants using
  the values in `readme.md` §3 and each component's `.prompt.md`.

### What won't survive the trip
- CSS custom properties resolve to computed hexes on import — that's why the
  variables go in first.
- `backdrop-filter` blur (topbar, marketing header) flattens; re-apply as a Figma
  background blur.
- The marquee, typewriter headline and scroll reveals are motion — they land as a
  single frame.

---

## 3. Suggested Figma file structure

```
CASPAA Design System
├── 📄 Cover              ← logo cuts from assets/logo/
├── 📄 Foundations        ← guidelines/*.html (colour, type, radius, spacing, elevation, motion)
├── 📄 Components         ← components/app + components/marketing
├── 📄 School OS          ← ui_kits/school_os screens
└── 📄 Marketing          ← ui_kits/marketing screens
```

Publish it as a **library**, then enable the variable collections so product files
pick up `accent.600` / `brand.600` rather than raw hexes.

---

## 4. If you'd rather not run a server

Ask me to bundle either kit into a single self-contained HTML file — every asset
inlined — and upload that file to html.to.design's *Upload* tab instead.
