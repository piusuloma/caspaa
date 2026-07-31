import React from 'react';

/* .tabs / .tab — active tab is navy text with a GREEN 2.5px underline.
   Arrow-key roving tabindex, matching tabs() in public/js/ui.js. */
export function Tabs({ tabs = [], value, onChange }) {
  const ref = React.useRef(null);
  const onKeyDown = (e, i) => {
    const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const next = tabs[(map[e.key] + tabs.length) % tabs.length];
    onChange && onChange(next.key);
    const el = ref.current && ref.current.querySelector('[data-key="' + next.key + '"]');
    if (el) el.focus();
  };
  return (
    <div className="tabs" role="tablist" ref={ref}>
      {tabs.map((t, i) => {
        const active = t.key === value;
        return (
          <button key={t.key} type="button" role="tab" data-key={t.key}
            aria-selected={active} tabIndex={active ? 0 : -1}
            className={'tab ' + (active ? 'active' : '')}
            onClick={() => onChange && onChange(t.key)} onKeyDown={e => onKeyDown(e, i)}>
            {t.label}
            {t.badge ? <span className="ml-2 badge badge-danger">{t.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
