import * as React from 'react';

/** Icon-only button for the topbar and table rows. `label` is required — the icon is decorative. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger';
  /** Apply the shell's !p-2 tightening. Default true. */
  tight?: boolean;
}

export function IconButton(props: IconButtonProps): JSX.Element;
