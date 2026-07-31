import React from 'react';

export function Select({ label, hint, options = [], placeholder, id, className = '', ...rest }) {
  const selectId = id || React.useMemo(() => 'sel-' + Math.random().toString(36).slice(2, 8), []);
  return (
    <div>
      {label && <label className="input-label" htmlFor={selectId}>{label}</label>}
      <select id={selectId} className={'input ' + className} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => {
          const value = typeof o === 'string' ? o : o.value;
          const text = typeof o === 'string' ? o : o.label;
          return <option key={value} value={value}>{text}</option>;
        })}
      </select>
      {hint && <p className="text-xs mt-1 text-slate-500">{hint}</p>}
    </div>
  );
}
