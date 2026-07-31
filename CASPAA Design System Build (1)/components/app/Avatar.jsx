import React from 'react';

export function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

/* Solid navy circle with initials, or the person's photo. Sizes match .avatar.* */
export function Avatar({ name, photo, size = 'md' }) {
  if (photo) {
    return (
      <span className={'avatar ' + size} style={{ background: 'none', overflow: 'hidden', padding: 0 }}>
        <img src={photo} alt={name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    );
  }
  return <span className={'avatar ' + size}>{initials(name)}</span>;
}
