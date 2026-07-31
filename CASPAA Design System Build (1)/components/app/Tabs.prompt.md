Hub views (Finance, Students, Academic) switch sub-views with these tabs; a count renders as a red badge.

```jsx
<Tabs value={tab} onChange={setTab} tabs={[{ key: 'invoices', label: 'Invoices' }, { key: 'recon', label: 'Reconciliation', badge: 3 }]} />
```
