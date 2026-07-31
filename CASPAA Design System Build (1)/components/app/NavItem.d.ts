import * as React from 'react';

/** Sidebar row — .nav-item: grey when idle, navy on brand-50 when active,
 *  red for the sign-out row. */
export interface NavItemProps {
  label: React.ReactNode;
  icon?: string;
  active?: boolean;
  /** Renders the destructive sign-out treatment. */
  signout?: boolean;
  onClick?: () => void;
}

export function NavItem(props: NavItemProps): JSX.Element;
