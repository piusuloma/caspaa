# Landing page image slots

Drop a file at the path below and it goes live — no code change. Until then the
page shows a labelled dashed placeholder naming the file it wants (except the
`SlotBackdrop` entries, which just leave the flat navy behind them).

Rendered by `components/SlotImage.js`, wired up in `pages/home.js`.

| # | File | Size | Where it appears |
|---|------|------|------------------|
| 1 | `hero-backdrop.jpg` | 1920×1080 | Behind the hero, at 15% over the navy. Needs to work dark and heavily overlaid — texture, not detail. No faces or text. |
| 2 | `schools/school-1.png` … `school-5.png` | 400×200, transparent PNG | "Trusted by" logo strip. Shown greyscale, colour on hover. |
| 3 | `solution.jpg` | 1200×800 | "One platform for every part of your school" — a school office or classroom with CASPAA in use. |
| 4 | `roles/proprietors.jpg` | 900×600 | Roles tab — Proprietors |
| 5 | `roles/principals.jpg` | 900×600 | Roles tab — Principals |
| 6 | `roles/teachers.jpg` | 900×600 | Roles tab — Teachers |
| 7 | `roles/parents.jpg` | 900×600 | Roles tab — Parents |
| 8 | `roles/students.jpg` | 900×600 | Roles tab — Students |
| 9 | `roles/finance.jpg` | 900×600 | Roles tab — Finance |
| 10 | `features/feature-1.jpg` | 1000×640 | WORKS WHERE YOU WORK (offline) |
| 11 | `features/feature-2.jpg` | 1000×640 | THE FINTECH ADVANTAGE (fees) |
| 12 | `features/feature-3.jpg` | 1000×640 | GROW YOUR SCHOOL (admissions) |
| 13 | `features/feature-4.jpg` | 1000×640 | DECIDE WHAT HAPPENS NEXT (analytics) |
| 14 | `security.jpg` | 1600×900 | Behind the "Built on trust" band, at 20%. Dark/abstract. |
| 15 | `cta-backdrop.jpg` | 1920×1080 | Behind the closing CTA, at 15%. Dark/abstract. |

## Notes
- Role photos sit on navy — images with darker or busier edges sit better.
- Backdrops are overlaid heavily; anything with fine detail or text will be lost.
- Keep each file under ~300KB. These are `loading="lazy"` but the hero backdrop is not deferred.
- `.jpg` for photos, `.png` for logos (transparency). To use a different
  extension, change the `src` in `pages/home.js`.
