import React from 'react';
import { Icon } from './Icon';

export function NavItem({ label, icon, active = false, signout = false, onClick }) {
  return (
    <a className={['nav-item', active ? 'active' : '', signout ? 'signout' : ''].filter(Boolean).join(' ')}
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}>
      <Icon name={icon} className="w-5 h-5" />
      <span>{label}</span>
    </a>
  );
}
