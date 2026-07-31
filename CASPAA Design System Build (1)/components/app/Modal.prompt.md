Everything in the app happens in modals — record payment, add student, notifications, profile, global search.

```jsx
<Modal title="Record Payment" onClose={close}
  footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button>Save Payment</Button></>}>
  <Input label="Amount Paid" />
</Modal>
```

The real implementation traps Tab and returns focus to the opener — keep that behaviour in production code.
