import React from 'react';

export function Input({ label, hint, error, id, prefixIcon, className = '', ...rest }) {
  const inputId = id || React.useMemo(() => 'in-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <div>
      {label && <label className="input-label" htmlFor={inputId}>{label}</label>}
      <div className={prefixIcon ? 'relative' : ''}>
        {prefixIcon && <span className="absolute left-3 top-2.5 text-slate-500">{prefixIcon}</span>}
        <input id={inputId} className={['input', prefixIcon ? 'pl-10' : '', className].filter(Boolean).join(' ')} {...rest} />
      </div>
      {(hint || error) && (
        <p className={'text-xs mt-1 ' + (error ? 'text-rose-600' : 'text-slate-500')}>{error || hint}</p>
      )}
    </div>
  );
}
