import * as React from 'react';

export interface TabItem { key: string; label: React.ReactNode; badge?: React.ReactNode }

/** Hub tab bar. Active = navy label + green underline. Keyboard: ←/→/Home/End. */
export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  onChange?: (key: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
