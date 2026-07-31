import React from 'react';

export function Eyebrow({ children, light = false }) {
  return (
    <p className={'text-xs font-bold tracking-[0.15em] mb-3 ' + (light ? 'text-accent-300' : 'text-site-700')}>
      {children}
    </p>
  );
}
