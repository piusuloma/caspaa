import React from 'react';
import { Icon } from './Icon';

/* .modal-backdrop / .modal-panel — 560px default, 'lg' 880px, 'xl' 1100px,
   pop-in 0.18s. Escape closes; footer actions are right-aligned on #f8fafc. */
export function Modal({ open = true, title, children, footer, size = '', onClose }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={'modal-panel ' + size} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button type="button" className="btn btn-ghost !p-1.5" aria-label="Close dialog" onClick={onClose}>
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto scroll-area flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
