import * as React from 'react';

/** Secondary marketing action. `light` for dark teal sections (white text, white/30 border),
 *  otherwise teal text on a site-200 border. */
export interface GhostButtonProps {
  children?: React.ReactNode;
  href?: string;
  light?: boolean;
  className?: string;
}

export function GhostButton(props: GhostButtonProps): JSX.Element;
