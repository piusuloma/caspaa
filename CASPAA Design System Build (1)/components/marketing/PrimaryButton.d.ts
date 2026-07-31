import * as React from 'react';

/**
 * The marketing site's only primary CTA style: CASPAA Green (#00b386) fill,
 * white label, bold 14px, lifts 2px on hover (.mkt-btn).
 * @startingPoint section="Marketing" subtitle="Marketing buttons, eyebrows and checks" viewport="700x200"
 */
export interface PrimaryButtonProps {
  children?: React.ReactNode;
  href?: string;
  className?: string;
}

export function PrimaryButton(props: PrimaryButtonProps): JSX.Element;
