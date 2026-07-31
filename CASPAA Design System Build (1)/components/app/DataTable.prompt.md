The workhorse table across Students, Invoices, Payments, Payroll and Ledger.

```jsx
<DataTable
  columns={[
    { key: 'student', header: 'Student' },
    { key: 'amount', header: 'Amount', align: 'right' },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ]}
  rows={rows} />
```

An empty tbody renders "Nothing to show yet." automatically — don't hand-roll that row.
