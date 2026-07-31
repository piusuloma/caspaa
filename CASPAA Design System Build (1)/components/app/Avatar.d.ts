import * as React from 'react';

/** Circular avatar — .avatar: solid brand navy, white bold initials.
 *  sm 32 · md 40 · lg 56 · xl 80. */
export interface AvatarProps {
  name?: string;
  /** Photo URL; replaces the initials. */
  photo?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar(props: AvatarProps): JSX.Element;
export function initials(name: string): string;
