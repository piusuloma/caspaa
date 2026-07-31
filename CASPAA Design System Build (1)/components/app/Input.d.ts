import * as React from 'react';

/**
 * Text field — .input: 1.5px #e2e8f0 border, 7px radius, 3px navy focus ring.
 * @startingPoint section="App" subtitle="Form fields, selects and labels" viewport="700x260"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Leading icon; adds the shell's pl-10 offset. */
  prefixIcon?: React.ReactNode;
}

export function Input(props: InputProps): JSX.Element;
