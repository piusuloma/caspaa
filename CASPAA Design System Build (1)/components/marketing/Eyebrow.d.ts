import * as React from 'react';

/** Section label above a heading: 12px bold, 0.15em tracking, ALL CAPS copy.
 *  Teal on light sections, accent-300 green on dark. */
export interface EyebrowProps {
  children?: React.ReactNode;
  light?: boolean;
}

export function Eyebrow(props: EyebrowProps): JSX.Element;
