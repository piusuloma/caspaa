import * as React from 'react';

/**
 * White surface — .card: 7px radius, 1px #f1f5f9 border, two-layer soft shadow.
 * @startingPoint section="App" subtitle="Cards, stat tiles and tables" viewport="700x300"
 */
export interface CardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Adds .card-hover (2px lift + brand border on hover). */
  hover?: boolean;
  /** Body padding utility. Default 'p-4'; pass 'p-0' for tables. */
  padding?: string;
  className?: string;
}

export function Card(props: CardProps): JSX.Element;
