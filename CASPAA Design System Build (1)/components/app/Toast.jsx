import React from 'react';
import { Icon } from './Icon';

const CONF = {
  success: ['check', 'text-emerald-600'],
  danger: ['x', 'text-red-600'],
  warn: ['bell', 'text-amber-600'],
  info: ['bell', 'text-brand-600'],
};

export function Toast({ message, type = 'success' }) {
  const [iconName, color] = CONF[type] || CONF.success;
  return (
    <div className={'toast ' + type} role="status">
      <div className={color}><Icon name={iconName} className="w-5 h-5" /></div>
      <div className="flex-1 text-sm font-medium text-slate-800">{message}</div>
    </div>
  );
}
