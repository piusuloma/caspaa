repo: piusuloma/caspaa
branch: main
path: (whole repo)

## Last sync
date: 2026-07-31T11:10:00Z
tree: 47ffed0bd6d0

### Updated in this project
- Rebuilt all tokens from the real source (structure, type, spacing, 7px radius, every component class).
- **Deliberate divergence:** colour follows the CASPAA brand guide, not the code — green #00B386 primary, teal #0A8491 chrome, gold #E69514 attention, plus --mod-* module hues. The repo's navy #0a2540 is retired via tokens/theme.css; the navy logo cut is replaced by caspaa-green.svg.
- Vendored public/css/styles.css verbatim as tokens/caspaa-app.css and copied the four logo SVGs plus site photography.
- Replaced the component library with the app's real primitives (.btn/.card/.input/.tbl/.badge/.stat/.tabs) and both inline icon sets.
- Rebuilt both UI kits: marketing home from pages/home.js + data/site.js, School OS finance workspace from public/js/app.js + ui.js.

## Screen map
| Screen / file | Built from |
|---|---|
| ui_kits/marketing/index.html, Sections.jsx, site-data.js | pages/home.js · components/SiteLayout.js · components/Icons.js · data/site.js |
| ui_kits/school_os/index.html, Shell.jsx, Views.jsx, app-data.js | public/js/app.js · public/js/ui.js · public/js/modules/finance.js (view names only) |
| ui_kits/tw-config.js | pages/_document.js (tailwind.config) |
| tokens/caspaa-app.css | public/css/styles.css (verbatim) |
| tokens/palette.css, typography.css, spacing.css, effects.css | pages/_document.js + public/css/styles.css |
| components/app/* | public/js/ui.js (ICONS, statCard, tabs, statusBadge, modal, toast, avatar, emptyState, pageHeader) + styles.css classes |
| components/marketing/* | components/SiteLayout.js (Logo, PrimaryButton, GhostButton, Eyebrow, Check) · components/Icons.js |
| assets/logo/*, assets/images/* | public/logo/* · public/icon.svg · public/images/* |

## Notes
- public/ IS the app — no build step for public/js.
- Not read in full (size): public/js/modules/finance.js (213KB), admin.js (795KB), teacher.js, parent.js, superadmin.js, data.js.
- Roles not yet recreated: schooladmin (+ group layer), principal, teacher, parent, student, superadmin (COP).
