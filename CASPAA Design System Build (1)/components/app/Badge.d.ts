import * as React from 'react';

/** Pill label — .badge: 2px/10px, 11.2px text, 600 weight. */
export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'success' | 'warn' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function Badge(props: BadgeProps): JSX.Element;
