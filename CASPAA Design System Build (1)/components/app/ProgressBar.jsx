import React from 'react';

export function ProgressBar({ value = 0, label, valueLabel }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || valueLabel) && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{label}</span>
          <span className="font-semibold text-slate-700">{valueLabel || pct + '%'}</span>
        </div>
      )}
      <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}
