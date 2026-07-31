import * as React from 'react';

export type MarketingIconName =
  | 'trending-down' | 'puzzle' | 'wifi-off' | 'hourglass' | 'cloud-off' | 'card'
  | 'bank' | 'sparkles' | 'file-edit' | 'check-circle' | 'trending-up' | 'lock'
  | 'message' | 'calculator' | 'globe' | 'headset' | 'folders' | 'users'
  | 'lightbulb' | 'shield' | 'user' | 'sync' | 'clock' | 'mail' | 'phone'
  | 'menu' | 'close';

/** The marketing site's inline icon set (components/Icons.js). Sits in an
 *  11x11 rounded site-50 tile with site-600 ink in feature cards. */
export interface MarketingIconProps {
  name: MarketingIconName;
  className?: string;
}

export function MarketingIcon(props: MarketingIconProps): JSX.Element | null;
