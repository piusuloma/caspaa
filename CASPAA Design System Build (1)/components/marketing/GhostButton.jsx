import React from 'react';

export function GhostButton({ children, href = '#', light = false, className = '' }) {
  const base = light
    ? 'text-white border-white/30 hover:bg-white/10'
    : 'text-site-700 border-site-200 hover:bg-site-50';
  return (
    <a href={href}
      className={'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm mkt-btn ' + base + ' ' + className}>
      {children}
    </a>
  );
}
