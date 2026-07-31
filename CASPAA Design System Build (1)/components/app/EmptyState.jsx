import React from 'react';
import { Icon } from './Icon';

export function EmptyState({ title, body, action, icon = 'package' }) {
  return (
    <div className="empty-state">
      <Icon name={icon} className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {body && <p className="text-sm mb-4">{body}</p>}
      {action}
    </div>
  );
}
