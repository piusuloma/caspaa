import * as React from 'react';

/** Marketing section wrapper — the site's vertical rhythm and container in one place.
 *  Alternate plain white, bg-slate-50, and bg-site-800 (dark teal) sections. */
export interface SectionShellProps {
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionShell(props: SectionShellProps): JSX.Element;
