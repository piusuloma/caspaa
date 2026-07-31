import React from 'react';

export function Card({ children, title, subtitle, action, hover = false, padding = 'p-4', className = '' }) {
  return (
    <section className={['card', hover ? 'card-hover' : '', className].filter(Boolean).join(' ')}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div>
            {title && <h3 className="font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={padding}>{children}</div>
    </section>
  );
}
