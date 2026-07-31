import React from 'react';

/* Filled tick used in feature lists and the comparison table. */
export function Check({ className = 'text-site-600' }) {
  return (
    <svg viewBox="0 0 20 20" className={'w-5 h-5 shrink-0 ' + className} fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd"
        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 111.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" />
    </svg>
  );
}
