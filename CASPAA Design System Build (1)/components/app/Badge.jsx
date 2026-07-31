import React from 'react';

const TONES = { success: 'badge-success', warn: 'badge-warn', danger: 'badge-danger', info: 'badge-info', neutral: 'badge-neutral' };

export function Badge({ children, tone = 'neutral', className = '' }) {
  return <span className={['badge', TONES[tone] || TONES.neutral, className].filter(Boolean).join(' ')}>{children}</span>;
}
