import React from 'react';

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={'skel ' + className} aria-hidden="true" />;
}
