import React from 'react';

/* Marketing CTA — CASPAA Green #00b386 fill, white label, green glow.
   (The repo shipped a lighter accent-400 fill with near-navy text; the brand
   palette supersedes it.) */
export function PrimaryButton({ children, href = '#', className = '' }) {
  return (
    <a href={href}
      className={'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-bold text-sm shadow-lg shadow-accent-600/25 hover:shadow-xl hover:shadow-accent-600/40 mkt-btn ' + className}>
      {children}
    </a>
  );
}
