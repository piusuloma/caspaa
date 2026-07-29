# CASPAA — School Operating System

A school ERP for African schools: students, academics, attendance, results, fees and
payments, staff & HR, communications, school services, multi-branch groups, and a
CASPAA operations portal (COP).

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

Next.js serves the app from [pages/index.js](pages/index.js), which loads the vanilla-JS
application out of [public/js/](public/js/). **`public/` is the app** — there is no
build step for the application code itself; edit the files in `public/js/` and reload.

> A second, standalone copy of the app used to live in `caspaa/` and was opened
> directly as `caspaa/index.html`. It drifted behind `public/` (it never received the
> student ledger, feature entitlements or multi-branch modules) and was removed. If you
> need it, it is in git history before this commit.

## Deploying

`git push` does **not** deploy. Ship with:

```bash
vercel --prod
```

## Demo data

The app runs on a LocalStorage-backed mock database seeded by `seedDatabase()` in
[public/js/data.js](public/js/data.js), keyed by `DB_KEY`.

**Adding to the seed?** A browser that already stored a database never re-seeds — it
would silently miss whatever you added. So bump `SEED_VERSION` and add a matching step
in `DB._migrate()` that adds only what is missing. Migrations must never overwrite or
remove a row; a stored database can contain real work done during a demo.

To wipe and re-seed a browser: profile menu (your name, top right) → **Reset demo data**.

## Signing in

Demo accounts are listed on the login screen (see `AUTH` in
[public/js/auth.js](public/js/auth.js)). Worth knowing:

| Account | Sees |
|---|---|
| `admin@brightlights.ng` — proprietor | Everything, **plus the multi-branch group layer** |
| `principal@brightlights.ng` | Academic + admin oversight, no finance settings |
| `finance@brightlights.ng` | Fees, invoices, payments, reconciliation, payroll |
| `adamu@brightlights.ng` — teacher | Attendance, results, assessments, lessons, diary |
| `parent@demo.ng` | Per-child dashboards, fees & ledger, results, consent |
| `super@caspaa.com` | CASPAA operations portal (COP) |

## Multi-branch

Model A — a branch **is** a tenant, with a group layer above it
([public/js/modules/group.js](public/js/modules/group.js)). The group owner gets a
consolidated Group Overview and can enter any branch, which re-points
`currentSchoolId()` so every per-school module scopes to that branch unchanged.

It only appears when **all** of these hold:

1. the signed-in user is a `schooladmin` (the proprietor) — principals and finance stay
   scoped to their own branch by design;
2. their school has a `groupId`; and
3. `hasFeature('multibranch')` is true — it is `defaultOff` in the catalog
   ([public/js/modules/entitlements.js](public/js/modules/entitlements.js)), so it needs
   either an Enterprise plan or a per-school override.

The seed sets all three up for Bright Lights Academy, which owns the Ikeja branch.

## Feature entitlements

A subscription plan sets what a school gets by default; the superadmin can override per
school to grant or remove a feature. `hasFeature()` resolves the effective entitlement,
and nav items and views for un-entitled features are hidden or locked behind an upgrade
CTA. `transport`, `multibranch` and others are `defaultOff` — they will not appear for a
school until explicitly granted.
