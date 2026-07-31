# CASPAA — Design System

> **CASPAA is the School Operating System for African schools.**
> Smart schools run on systems. Great schools run on CASPAA.

Brand foundations, design tokens, the real component classes, UI kits for both
product surfaces, and a Figma export path — all derived from the CASPAA codebase.

---

## 1. About CASPAA

CASPAA is an **Edu-Fintech powered School Operating System**: a school ERP for
African schools covering students, academics, attendance, results, fees and
payments, staff & HR, communications, school services, multi-branch groups, and a
CASPAA operations portal (COP).

- **Vision** — to become the digital infrastructure powering every successful
  school in Africa.
- **Mission** — help schools operate efficiently, increase revenue, improve
  stakeholder engagement and make smarter decisions through one integrated
  platform.
- **Contact** — info@caspaa.org · 0803 201 1561 · 0803 200 1561
- **Pricing model** — per student, per term: Standard ₦3,000 · Premium ₦5,000 ·
  Ultimate ₦5,000+ (multi-branch), plus a one-off setup fee from ₦100,000 that
  includes 2–3 days of training. VAT exclusive.

### Surfaces
| Surface | Where it lives in the repo | UI kit here |
|---|---|---|
| **Marketing site** (Next.js pages) | `pages/*.js`, `components/SiteLayout.js`, `data/site.js` | `ui_kits/marketing/` |
| **School OS web app** (vanilla-JS, PWA, offline-first) | `public/js/` + `public/css/styles.css` — *`public/` is the app*, no build step | `ui_kits/school_os/` |

The app is **role-based**: superadmin (CASPAA operations), schooladmin
(proprietor, with the multi-branch group layer), principal, finance/bursar,
teacher, parent, student. Each role gets its own nav menu from
`APP.navFor(role)`, and features are gated by subscription entitlements
(`hasFeature()`).

### Sources
| Source | Role |
|---|---|
| **github.com/piusuloma/caspaa** @ `main` | **Authoritative.** Colour, type, radii, spacing, every component class, both shells, all marketing copy, the logo SVGs and site photography. See `github.md`. |
| `uploads/CASPAA BRAND GUIDE PDF.pdf` (24pp) | Brand strategy, logo meaning and usage rules, photography direction, merchandise. Its palette is partly superseded — see the note below. |
| `https://caspaa-eight.vercel.app/` | The deployed site (client-rendered; only the `<head>` is fetchable). |

> **The brand guide's palette wins over the code's.** The repo shipped a deep navy
> `#0a2540` as its action colour and a slightly different gold (`#f4b400`). This
> system uses the guide instead — **CASPAA Green `#00B386`, CASPAA Blue `#0A8491`,
> Accent Gold `#E69514`, Soft White `#F8FAFC`, Light Gray `#CBD5E1`** — with
> `#1E293B` reserved for text. **No navy anywhere.** `tokens/theme.css` enforces
> this over the vendored stylesheet; structure, type, spacing, radii and behaviour
> still come from the code.

---

## 2. Content Fundamentals

Two registers, deliberately different — match the surface you are writing for.

### Marketing site
- **Voice** — direct, confident, outcome-led. Names the pain, then the fix.
  *"Most schools run on a patchwork of tools that don't talk to each other."*
- **Casing** — **Title Case** CTAs ("Book a Demo", "Talk to Sales"), sentence-case
  headlines with a full stop, **ALL CAPS eyebrows** ("THE PROBLEM", "INSIDE THE
  PLATFORM", "BUILT ON TRUST").
- **Headlines** end in a period and often stack a claim + a promise:
  *"Less admin. More teaching."* · *"Total visibility. Total control. From anywhere."*
- **Punchlines** close sections in accent green italic:
  *"Get your evenings back."* · *"Most systems tell you what happened. CASPAA helps
  you decide what happens next."*
- **Spelling** — British/Nigerian English: *enrolment, customisation, organise.*
- **Numbers** — concrete and unrounded: ₦3.6m+ collected, 2,000+ students, 50+
  schools, 99.9% uptime, "loans approved in as little as 24 hours", "pay in 30
  seconds".
- **Never** — emoji, exclamation marks, "revolutionary", vague AI hype.

### Product (School OS)
- **Casing** — **Title Case** for buttons, nav items and modal titles ("Record
  Payment", "Mark All Read", "Fee Structure"); sentence case for helper text and
  toasts.
- **Money** — `money()`: `₦` + comma thousands, no decimals → **₦12,400,000**.
- **Dates** — `fdate()`: `28 Jul`, `28 July 2026`, or relative (`2h ago`).
- **Terms** — "Second Term · 2025/2026". Classes are JSS 1–3 / SS 1–3.
- **Fee status vocabulary** — **Paid · Partial · Outstanding** (not "overdue"),
  payments are **Successful · Pending · Failed**.
- **Empty states** — name the absence, offer the step: *"All caught up — no
  notifications to show."* Tables fall back to "Nothing to show yet."
- **Toasts** — one short line: *"Payment recorded"*, *"Session revoked"*,
  *"Offline mode ON — changes will sync when you come back online"*.
- **Offline copy** is a first-class part of the voice: the app tells you what
  happens to your work when the network drops.

---

## 3. Visual Foundations

### Colour
**The palette is the brand guide's, and it contains no navy.** The shipped app used
a deep navy `#0a2540` for actions; `tokens/theme.css` (imported last) re-points
every navy token onto the brand palette, so the vendored component classes change
colour without any component edits.

| Family | Base | Job |
|---|---|---|
| **accent** (CASPAA Green) | `#00b386` `--accent-600` | **Primary action** — save, confirm, create, "money in"; fee progress; positive trends; active-tab underline; the marketing CTA |
| **brand** (CASPAA Blue, teal) | `#0a8491` `--brand-600` | **Chrome** — active nav, links, tab type, dark panels, chat bubbles, marketing dark sections (`800` `#06545d`) |
| **gold** (Accent Gold) | `#e69514` `--gold-500` | Attention — fee reminders, outstanding balances, the Ultimate plan, `.btn-gold` |
| **module colours** | `--mod-*` | One hue per module (fees green, academics teal, students gold, staff `#14a3a0`, attendance `#4bb543`, reports `#7a5cd6`, comms `#e0655c`, store `#d69e00`) with a matching soft wash |
| **neutrals** | `#f8fafc` Soft White page · `#f1f5f9` card border · `#e2e8f0` divider · `#cbd5e1` Light Gray · `#808d9b` muted · `#1e293b` Dark Gray (text only) | Everything else |

**How the colour is used.** A school system has many modules, so chrome stays calm
and *content* carries the colour: stat tiles take a 3px coloured top rule and a
tinted icon chip, sidebar icons sit in their module's tint, avatars rotate through
the three brand hues, and progress bars go green → gold → red as a collection rate
falls. Two module colours per card, maximum — never a rainbow inside one panel.

Status pairs are fixed: success `#dcfce7/#166534`, warn `#fef3c7/#92400e`,
danger `#fee2e2/#991b1b`, info `brand-100/brand-700`.

### Type
**Figtree** only (400/500/600/700/800), 16px base, 1.5 line-height, mono maps to
Figtree too. Scale 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36; marketing headlines run
48 → 60 → 72px ExtraBold with `tracking-tight`. `.page-title` 24px/700/-0.01em ·
`.stat-value` 30px/700 · `.stat-label` and `.tbl th` 12px/600 uppercase at 0.04em ·
eyebrows 12px/700 at 0.15em.

### Radius, cards, borders
**Every radius is 7px.** The Tailwind config rewrites `sm`→`3xl` to 7px, so even
`rounded-3xl` is 7px; only `--r-pill` (999px) is round. Cards: white,
`1px #f1f5f9`, 7px, two-layer shadow
`0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.05)`; `.card-hover` lifts
2px to `0 8px 24px rgba(15,23,42,.08)` with a `brand-100` border. Inputs carry a
**1.5px** border and a 3px `rgba(10,37,64,.16)` focus ring.

### Surfaces & backgrounds
App: `#f8fafc` page, white cards, white sidebar, white topbar — colour arrives via
module tints and soft washes (`--mod-*-soft`), not gradients. The only gradient in
the system is the three-hue rule under the sidebar logo. Marketing: white and `slate-50` sections alternating with
**flat dark teal `site-800`** blocks; photography sits *under* those blocks at
`opacity-15`–`opacity-20`, plus two large blurred colour orbs behind the hero
(`site-500/30`, `accent-400/10`). No SaaS purple, no gradient fills.

### Motion
Quick and unfussy in the app, expressive on the site — all of it gated on
`prefers-reduced-motion`:
- 150ms ease on buttons and nav; 180ms card/modal lift and pop-in; 250ms
  `.fade-in` route change and toast slide-in; 400ms progress width.
- Dashboard `.rise-in`: 450ms `cubic-bezier(.16,1,.3,1)` with a 45ms stagger over
  the first ten cards — **only on a view change**, never on keystrokes.
- Marketing scroll-reveal: 1.3s `cubic-bezier(.16,1,.3,1)`, 28px travel, staggered
  130ms apart; hero cards drift 12px over 11s; platform marquee scrolls 55s linear
  and pauses on hover; hero headline types at 75ms/char, holds 2.8s, deletes at
  35ms.

### Interaction states
Hover darkens fills one step (`accent-600 → accent-700`, `brand-600 → brand-700`);
green and gold buttons carry white labels. Ghost controls
take a `#f1f5f9` wash. Focus is a 3px brand ring on fields and a 2px
`brand-500` outline (offset 2px) on everything else focusable. Disabled is 50%
opacity with `not-allowed`.

### Layout
App: 256px fixed sidebar + 56px sticky topbar + `p-4`/`lg:p-6` main; mobile drops
to a 288px drawer and a bottom nav with a safe-area pad. Marketing: 1280px
container, 20px gutters, `py-24`/`md:py-32` sections, a 64px header that starts
transparent over the hero and turns `white/90` + blur past 24px of scroll.
8pt spacing grid (`--s-1`…`--s-6` = 4/8/16/24/32/40).

---

## 4. Iconography

CASPAA ships **two hand-rolled inline SVG sets**, both 24px grid, 2px stroke,
round caps and joins, `currentColor` — no icon font, no third-party set, **no
emoji anywhere**.

- **App set** — `ICONS` in `public/js/ui.js` (~40 glyphs: dashboard, students,
  teacher, classes, attendance, results, fees, naira, loan, reports, wifi/wifi_off,
  bus, wallet, sparkles…). Reproduced in `components/app/Icon.jsx`.
- **Marketing set** — `components/Icons.js` (problems, platform tiles, outcomes,
  security). Reproduced in `components/marketing/MarketingIcon.jsx`.
- Icons are **always decorative** (`aria-hidden`); the accessible name lives on the
  wrapping button. In feature cards they sit in an 11×11 `site-50` tile with
  `site-600` ink; in stat cards a 10×10 `brand-50` tile with `brand-700` ink.
- Chevrons on selects and the calendar glyph on date inputs are **CSS
  background SVGs** (slate, turning `#00b386` on focus) — see `select.input`.

### Logo
`assets/logo/`: `caspaa-navy.svg` (default), `caspaa-white.svg` (dark surfaces),
`caspaa-green.svg`, `caspaa-icon.svg` (white mark on a `#0a8491` tile — favicon,
PWA icon, app tile). `h-8` on the marketing site, `h-6` in the app sidebar.
Guide rules still stand: never rotate, recolour, add a shadow, stretch, or shrink
below legibility, and keep clear space around it.

---

## 5. Figma export

1. **Tokens → variables.** `figma/caspaa.tokens.json` (Tokens Studio / W3C format)
   carries every colour ramp, the type scale, spacing, radii and shadows. Import
   with the *Tokens Studio* plugin → *Apply to document* → *Export to Figma
   variables*. Names match the CSS 1:1 (`caspaa.color.brand.600` ↔ `--brand-600`).
2. **Screens → frames.** Open `ui_kits/marketing/index.html` or
   `ui_kits/school_os/index.html` and import with *html.to.design* ("layers as auto
   layout"). Install **Figtree** first.
   Full steps in `figma/README.md`.

---

## 6. Index

- `readme.md` — this file · `SKILL.md` — agent-skill manifest · `github.md` — repo link + sync log
- `styles.css` — the single entry point (imports only)
- `tokens/` — `palette.css`, `typography.css`, `spacing.css`, `effects.css`,
  `semantic.css`, and **`caspaa-app.css` — the repo's own stylesheet, vendored
  verbatim** (all `.btn`/`.card`/`.input`/`.tbl`/`.badge`/motion classes)
- `assets/logo/` — four logo cuts · `assets/images/` — real site photography and chart cards
- `figma/` — `caspaa.tokens.json`, `README.md`
- `guidelines/` — 15 specimen cards (colour ramps, neutrals, status, type, radius, spacing, elevation, logo, motion, photography)
- `components/app/` — Icon, Button, IconButton, Input, Select, Badge, StatusBadge,
  Card, StatCard, DataTable, Avatar, Chip, ProgressBar, Tabs, Modal, Toast,
  EmptyState, PageHeader, NavItem, Spinner, Skeleton, ChatBubble
- `components/marketing/` — Logo, PrimaryButton, GhostButton, Eyebrow, Check,
  MarketingIcon, SectionShell
- `ui_kits/marketing/` · `ui_kits/school_os/` · `ui_kits/tw-config.js` (the app's
  Tailwind Play config, verbatim)

### Intentional additions
- `components/app/Icon.jsx` and `MarketingIcon.jsx` wrap glyph sets the repo defines
  as raw SVG strings — a component is needed to use them in React.
- `SectionShell` extracts the repeated marketing `Section()` wrapper.
- `tokens/semantic.css` role aliases are new naming over existing values; nothing
  in the vendored CSS depends on them.

---

## 7. Caveats
1. `public/js/modules/finance.js` (213KB) and `admin.js` (795KB) were **not read in
   full** — the finance kit follows the shell, helper functions and CSS exactly,
   but field-level details of individual finance screens may differ.
2. The app's charts use **Chart.js + ApexCharts**; the kit draws CSS bars and a
   conic-gradient donut instead.
3. `/images/features/*` and `/images/roles/*` are **empty slots in the repo**, so
   the marketing kit shows labelled placeholders rather than invented imagery.
4. Only the **finance** role is built out. The other six role workspaces
   (proprietor + group layer, principal, teacher, parent, student, COP superadmin)
   are documented but not recreated.
5. Figtree loads from Google Fonts, as in the repo — no self-hosted files exist.
6. The retheme is a **deliberate divergence from the codebase**: production code
   still renders navy until `tokens/theme.css` (or its values) ships into
   `public/css/styles.css`. Colour contrast was checked for white-on-green
   (`#00b386`, 2.4:1 at 14px — used only on bold 14px+ labels, matching the repo's
   own `.btn-accent`); if the team needs AA on small text, darken action fills to
   `--accent-700 #00966f`.
7. The uploaded brand-guide PDF was removed from the project during cleanup —
   re-attach it if you want it stored here.
