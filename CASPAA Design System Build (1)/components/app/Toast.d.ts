import * as React from 'react';

/** White toast with a 4px coloured left border, slides in from the right, auto-dismisses
 *  after 3s in the real app. One line of copy. */
export interface ToastProps {
  message: React.ReactNode;
  type?: 'success' | 'danger' | 'warn' | 'info';
}

export function Toast(props: ToastProps): JSX.Element;
