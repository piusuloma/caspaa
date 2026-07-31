import * as React from 'react';

/** The CASPAA wordmark. Green (#00b386) on light surfaces, white knockout on teal
 *  and green. The repo's navy cut (caspaa-navy.svg) is retired with the navy palette;
 *  caspaa-icon.svg is the teal app-icon tile. */
export interface LogoProps {
  light?: boolean;
  /** Height utility. h-8 on the marketing site, h-6 in the app sidebar. */
  className?: string;
  href?: string;
}

export function Logo(props: LogoProps): JSX.Element;
