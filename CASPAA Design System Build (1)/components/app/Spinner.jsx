import React from 'react';

export function Spinner({ className = '' }) {
  return <span className={'spinner ' + className} role="status" aria-label="Loading" />;
}
