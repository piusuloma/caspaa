import * as React from 'react';

export type StatusKey = keyof typeof import('./StatusBadge').STATUS_MAP;

/** Canonical record status pill. Pass the raw status key the data layer stores
 *  ('paid', 'partial', 'outstanding', …) and it renders the right tone + label. */
export interface StatusBadgeProps { status: string }

export function StatusBadge(props: StatusBadgeProps): JSX.Element;
export const STATUS_MAP: Record<string, [string, string]>;
