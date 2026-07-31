import * as React from 'react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'warn' | 'gold';

/**
 * App button. Renders the shipped .btn / .btn-* classes, retheme applied:
 * teal `primary` (chrome), green `accent` (the main action), gold `gold`.
 * @startingPoint section="App" subtitle="Buttons, badges and chips in every CASPAA variant" viewport="700x240"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  /** 'lg' adds .btn-lg (12px/24px padding, 16px text). Default 'md'. */
  size?: 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button(props: ButtonProps): JSX.Element;
