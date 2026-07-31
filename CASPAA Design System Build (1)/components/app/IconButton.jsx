import React from 'react';

/* The shell writes these as .btn.btn-ghost with a tightened pad (!p-2). */
export function IconButton({ children, label, variant = 'ghost', tight = true, className = '', ...rest }) {
  const cls = ['btn', 'btn-' + variant, tight ? '!p-2' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
