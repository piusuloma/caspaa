# UI kit — CASPAA School OS (web app)

Recreation of the shipped app shell and the finance role's views, built from
`public/js/app.js`, `public/js/ui.js` and `public/css/styles.css`
(piusuloma/caspaa @ main).

## What's faithful
- **Shell**: fixed 256px white sidebar (`w-64`, green logo cut at `h-6`, role label under it),
  `.nav-item` rows — grey idle, navy on `brand-50` active, red sign-out; 56px sticky
  topbar (`h-14`) with the slate search button and its `/` `<kbd>`, notification bell
  with the red unread dot, the online/offline toggle, and the profile button;
  `#mainArea` at `p-4 lg:p-6`; the mobile bottom nav (4 items + More).
- **Nav menu**: exactly `APP.navFor('finance')` — Dashboard, Fee Structure, Invoices,
  Payments, Reconciliation, Expenses, School Store, Lending, Financial Reports.
- **Components**: `.stat` tiles (reserved trend line included), `.card`, `.tbl` with
  `.num` tabular columns, `.badge-*` statuses (Paid / Partial / Outstanding /
  Successful / Pending / Failed), `.chip` filters, `.tabs`, `.progress`, `.avatar`
  (solid navy initials), `.modal-backdrop`/`.modal-panel`, `.toast` with its 4px
  left border, `.empty-state`, `.fade-in`.
- **Behaviour**: sidebar routing, invoice status tabs, Record Payment modal → toast,
  offline toggle → amber "Offline — changes saved locally" pill + toast.

## Views
| Key | Contents |
|---|---|
| `fin_dashboard` | 4 stat tiles, collection-by-month bars, fee-mix donut, recent payments, per-class collection, outstanding-invoice callout |
| `fin_invoices` | Tabbed invoice register (All / Paid / Partial / Outstanding) |
| `fin_payments` | Payment ledger with method, date, status |
| `fin_recon` | Unmatched bank credits with Match action + outstanding by class |
| others | Honest "not part of this kit" empty state |

## Notes
- Data in `app-data.js` is demo data in the shape the app uses (₦ with comma
  thousands, "Second Term · 2025/2026", JSS/SS classes). The real app seeds
  LocalStorage from `public/js/data.js`.
- Charts here are CSS (bars, conic-gradient donut); the real app uses Chart.js and
  ApexCharts, loaded in `pages/_document.js`.
- `finance.js` is 213KB and was not read in full, so field-level details of the
  real finance screens (column sets, filter chips) may differ.
