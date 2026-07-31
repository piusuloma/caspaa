import * as React from 'react';

/** Zero-data placeholder — .empty-state: centred, muted, 64px icon at 50% opacity. */
export interface EmptyStateProps {
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: React.ReactNode;
  icon?: string;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
