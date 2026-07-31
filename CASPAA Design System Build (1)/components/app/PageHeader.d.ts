import * as React from 'react';

/** View header — .page-title (24px bold, -0.01em) + .page-subtitle (14px muted),
 *  actions right-aligned. Omit inside a hub: the hub owns the title. */
export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader(props: PageHeaderProps): JSX.Element;
