Every panel in the app. Tables go in a `padding="p-0"` card — the stylesheet already lets `.card` scroll horizontally when it wraps a `.tbl`.

```jsx
<Card title="Recent Payments" action={<Button variant="ghost" size="md">View all</Button>} padding="p-0">
  <DataTable … />
</Card>
```
