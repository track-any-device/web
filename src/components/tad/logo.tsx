import React from 'react';

/* TAD-PAK brand logo. Assets live in web/public/brand/ (from the tad-pak-design skill). */

export interface LogoProps {
  variant?: 'wordmark' | 'mark';
  /** Use the dark-theme wordmark (lighter green) for dark backgrounds. */
  dark?: boolean;
  /** Rendered height in px. */
  height?: number;
  className?: string;
}

export function Logo({ variant = 'wordmark', dark = false, height, className }: LogoProps) {
  const src =
    variant === 'mark'
      ? '/brand/mark.svg'
      : dark
        ? '/brand/wordmark-dark.svg'
        : '/brand/wordmark-light.svg';
  const h = height ?? (variant === 'mark' ? 34 : 28);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="TAD-PAK GPS" height={h} style={{ height: h, width: 'auto', display: 'block' }} className={className} />
  );
}
