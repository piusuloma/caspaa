import * as React from 'react';

export interface StatTrend { direction: 'up' | 'down'; label: string }

/** Dashboard metric tile — .stat / .stat-label / .stat-value / .stat-trend.
 *  Label is UPPERCASE 12px; value is 30px bold; the trend row is always reserved. */
export interface StatCardProps {
  label: React.ReactNode;
  /** Pre-formatted — money() output, a percentage, or a count. */
  value: React.ReactNode;
  trend?: StatTrend;
  icon?: string;
  color?: 'brand' | 'gold' | 'rose' | 'slate' | 'amber';
}

export function StatCard(props: StatCardProps): JSX.Element;
