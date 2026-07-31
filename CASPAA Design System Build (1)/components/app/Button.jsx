import React from 'react';

/* Maps to the real .btn classes in public/css/styles.css:
   8px/16px padding, 7px radius, 600 weight, 14px/20px text. */
const VARIANTS = {
  primary: 'btn-primary',      // CASPAA Blue #0a8491 (chrome action)
  accent: 'btn-accent',        // CASPAA Green #00b386, white label (primary action)
  secondary: 'btn-secondary',  // #eef2f6 + 1px border
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  warn: 'btn-warn',
  gold: 'btn-gold',
};

export function Button({
  children, variant = 'primary', size = 'md', iconLeft, iconRight,
  fullWidth = false, disabled = false, type = 'button', className = '', ...rest
}) {
  const cls = [
    'btn', VARIANTS[variant] || VARIANTS.primary,
    size === 'lg' ? 'btn-lg' : '',
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {iconLeft}{children}{iconRight}
    </button>
  );
}
