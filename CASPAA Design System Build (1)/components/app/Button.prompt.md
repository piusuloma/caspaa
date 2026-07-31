The app's action button. **Green `accent` is the main action** (save, confirm, collect); teal `primary` is the chrome action; gold for reminders and Ultimate-plan CTAs. No navy exists in this system.

```jsx
<Button variant="primary" iconLeft={<Icon name="plus" className="w-4 h-4" />}>Record Payment</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete invoice</Button>
```

App labels are Title Case ("Record Payment", "Mark All Read") — that is the house style in the shipped app, unlike the marketing site's sentence case.
