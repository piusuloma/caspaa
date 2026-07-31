import * as React from 'react';

/** Filter pill — .chip: slate wash, navy fill when active. */
export interface ChipProps {
  children?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip(props: ChipProps): JSX.Element;
