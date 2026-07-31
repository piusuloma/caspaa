import * as React from 'react';

export type IconName =
  | 'dashboard' | 'students' | 'teacher' | 'classes' | 'attendance' | 'results'
  | 'fees' | 'naira' | 'info' | 'chat' | 'bell' | 'loan' | 'reports' | 'settings'
  | 'logout' | 'plus' | 'search' | 'download' | 'upload' | 'edit' | 'trash'
  | 'check' | 'x' | 'menu' | 'arrow_left' | 'user' | 'building' | 'calendar'
  | 'book' | 'package' | 'trending_up' | 'trending_down' | 'sparkles' | 'shield'
  | 'wallet' | 'send' | 'bus' | 'wifi' | 'wifi_off';

/** The app's own inline SVG icon set (public/js/ui.js). Always decorative — put the
 *  accessible name on the wrapping button or link. */
export interface IconProps {
  name?: IconName;
  /** Tailwind size classes. Default 'w-5 h-5'. */
  className?: string;
  strokeWidth?: number;
}

export function Icon(props: IconProps): JSX.Element;
export const ICON_PATHS: Record<string, string>;
