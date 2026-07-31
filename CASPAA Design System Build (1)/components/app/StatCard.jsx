import React from 'react';
import { Icon } from './Icon';

const COLORS = {
  brand: 'bg-brand-50 text-brand-700',
  gold: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-50 text-amber-700',
};

export function StatCard({ label, value, trend, icon, color = 'brand' }) {
  return (
    <div className="stat">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="stat-label flex items-center gap-1">{label}</div>
          <div className="stat-value">{value}</div>
          {trend
            ? <div className={'stat-trend ' + (trend.direction === 'up' ? 'up' : 'down')}>
                <Icon name={trend.direction === 'up' ? 'trending_up' : 'trending_down'} className="w-3 h-3" />
                <span>{trend.label}</span>
              </div>
            /* Reserve the trend line so values share a baseline across the row. */
            : <div className="stat-trend" aria-hidden="true">&nbsp;</div>}
        </div>
        {icon && (
          <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + (COLORS[color] || COLORS.brand)}>
            <Icon name={icon} className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
