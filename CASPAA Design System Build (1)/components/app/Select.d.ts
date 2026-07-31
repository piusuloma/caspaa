import * as React from 'react';

export interface SelectOption { value: string; label: string }

/** Native select styled by `select.input` — appearance stripped, custom slate chevron
 *  that turns green (#00b386) on focus. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  options?: Array<SelectOption | string>;
  placeholder?: string;
}

export function Select(props: SelectProps): JSX.Element;
