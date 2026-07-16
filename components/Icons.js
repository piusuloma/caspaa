/* Flat line icons for the marketing site — same stroke language as the app's
   icon set (24px grid, 2px stroke, round caps). Inline so they inherit
   currentColor and add no network request. */
const PATHS = {
  bolt: <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />,
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  sync: (
    <>
      <path d="M21 12a9 9 0 01-9 9 9 9 0 01-7.5-4" />
      <path d="M3 12a9 9 0 019-9 9 9 0 017.5 4" />
      <path d="M17 7h4V3M7 17H3v4" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l3.5-4 3 2.5L20 7" />
    </>
  ),
}

export default function Icon({ name, className = 'w-4 h-4' }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d}
    </svg>
  )
}
