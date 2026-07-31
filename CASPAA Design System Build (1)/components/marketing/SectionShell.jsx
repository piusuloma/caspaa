import React from 'react';

/* Section() from pages/home.js: 96px/128px vertical rhythm, 1280px container,
   20px gutters, scroll-margin for anchor links. */
export function SectionShell({ id, className = '', children }) {
  return (
    <section id={id} className={'py-24 md:py-32 scroll-mt-16 ' + className}>
      <div className="max-w-7xl mx-auto px-5">{children}</div>
    </section>
  );
}
