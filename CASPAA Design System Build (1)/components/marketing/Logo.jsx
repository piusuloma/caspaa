import React from 'react';

/* The official wordmark. `light` swaps to the white cut for dark surfaces.
   Source: Logo() in components/SiteLayout.js — h-8 on marketing, h-6 in the app. */
export function Logo({ light = false, className = 'h-8 w-auto', href = '#' }) {
  const src = light ? '../../assets/logo/caspaa-white.svg' : '../../assets/logo/caspaa-green.svg';
  return (
    <a href={href} className="flex items-center shrink-0" aria-label="CASPAA home">
      <img src={src} alt="CASPAA" className={className} />
    </a>
  );
}
