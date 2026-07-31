import React from 'react';

export function Chip({ children, active = false, onClick, className = '' }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={['chip', active ? 'active' : '', className].filter(Boolean).join(' ')}>
      {children}
    </button>
  );
}
