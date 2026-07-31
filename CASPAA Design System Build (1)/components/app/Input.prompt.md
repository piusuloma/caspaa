Standard field. Inside a sign-up flow, wrap the form in `.signup-form` to get the roomier padding/type the real app uses.

```jsx
<Input label="Amount Paid" placeholder="0.00" />
<Input label="Search" prefixIcon={<Icon name="search" className="w-5 h-5" />} />
```

Money is formatted `₦12,400` (see `money()` in ui.js): naira sign, comma thousands, no decimals.
