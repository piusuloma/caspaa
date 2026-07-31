# Landing page image slots

All slots are filled. Sources live in `all/` (git-ignored — 111MB of originals,
local only); the files below are the processed, web-sized versions that ship.

To swap one: replace the file at the same path, or re-run the resize with a new
source. Targets are centre-cropped to the aspect the layout renders.

Rendered by `components/SlotImage.js`, wired up in `pages/home.js`.

| # | File | Size | Where it appears |
|---|------|------|------------------|
| 1 | `hero-backdrop.jpg` | 1920×1080 | Behind the hero, at 15% over the navy. Needs to work dark and heavily overlaid — texture, not detail. No faces or text. |
| 2 | `solution.jpg` | 1200×800 | "One platform for every part of your school" — a school office or classroom with CASPAA in use. |
| 3 | `roles/proprietors.jpg` | 900×600 | Roles tab — Proprietors |
| 4 | `roles/principals.jpg` | 900×600 | Roles tab — Principals |
| 5 | `roles/teachers.jpg` | 900×600 | Roles tab — Teachers |
| 6 | `roles/parents.jpg` | 900×600 | Roles tab — Parents |
| 7 | `roles/students.jpg` | 900×600 | Roles tab — Students |
| 8 | `roles/finance.jpg` | 900×600 | Roles tab — Finance |
| 9 | `features/feature-1.jpg` | 1000×640 | WORKS WHERE YOU WORK (offline) |
| 10 | `features/feature-2.jpg` | 1000×640 | THE FINTECH ADVANTAGE (fees) |
| 11 | `features/feature-3.jpg` | 1000×640 | GROW YOUR SCHOOL (admissions) |
| 12 | `features/feature-4.jpg` | 1000×640 | DECIDE WHAT HAPPENS NEXT (analytics) |
| 13 | `security.jpg` | 1600×900 | Behind the "Built on trust" band, at 20%. Dark/abstract. |
| 14 | `cta-backdrop.jpg` | 1920×1080 | Behind the closing CTA, at 15%. Dark/abstract. |

## Notes
- Role photos sit on navy — images with darker or busier edges sit better.
- Backdrops are overlaid heavily; anything with fine detail or text will be lost.
- Keep each file under ~300KB. These are `loading="lazy"` but the hero backdrop is not deferred.
- `.jpg` for photos, `.png` for logos (transparency). To use a different
  extension, change the `src` in `pages/home.js`.
