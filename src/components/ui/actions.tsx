'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — Actions (Button, IconButton). Styles in src/styles/tad.css. */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  block?: boolean;
  loading?: boolean;
  as?: 'button' | 'a';
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  block = false,
  loading = false,
  disabled = false,
  as = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const Tag = as as React.ElementType;
  const cls = cn(
    'tad-btn',
    `tad-btn--${variant}`,
    size !== 'md' && `tad-btn--${size}`,
    block && 'tad-btn--block',
    className,
  );
  return (
    <Tag className={cls} disabled={disabled || loading || undefined} {...rest}>
      {loading ? <span className="tad-btn__spin" aria-hidden="true" /> : icon}
      {children}
      {iconRight}
    </Tag>
  );
}

export type IconButtonVariant = 'ghost' | 'solid' | 'outline';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  /** Accessible label (also used as the tooltip). */
  label?: string;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  active = false,
  label,
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const cls = cn(
    'tad-iconbtn',
    variant !== 'ghost' && `tad-iconbtn--${variant}`,
    size !== 'md' && `tad-iconbtn--${size}`,
    active && 'tad-iconbtn--active',
    className,
  );
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}
