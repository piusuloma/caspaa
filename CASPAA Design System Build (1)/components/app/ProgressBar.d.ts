import * as React from 'react';

/** Solid navy meter — .progress / .progress-bar, 8px tall, pill ends, 400ms width ease. */
export interface ProgressBarProps {
  /** 0–100. */
  value?: number;
  label?: React.ReactNode;
  valueLabel?: React.ReactNode;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
