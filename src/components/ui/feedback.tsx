'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — Feedback (Badge, StatusDot, Tag). Styles in src/styles/tad.css. */

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'solid' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  mono?: boolean;
}

export function Badge({ variant = 'neutral', dot = false, mono = false, className = '', children, ...rest }: BadgeProps) {
  return (
    <span className={cn('tad-badge', `tad-badge--${variant}`, mono && 'tad-badge--mono', className)} {...rest}>
      {dot && <span className="tad-badge__dot" />}
      {children}
    </span>
  );
}

export type DeviceStatus = 'moving' | 'idle' | 'parked' | 'offline' | 'online' | 'warning';

const STATUS_LABELS: Record<DeviceStatus, string> = {
  moving: 'Moving', idle: 'Idle', parked: 'Parked', offline: 'Offline',
  online: 'Moving', warning: 'Idle',
};

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: DeviceStatus;
  label?: React.ReactNode;
  size?: 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusDot({ status = 'moving', label, size = 'md', showLabel = true, className = '', ...rest }: StatusDotProps) {
  const text = label !== undefined ? label : STATUS_LABELS[status];
  return (
    <span
      className={cn('tad-status', `tad-status--${status}`, size === 'lg' && 'tad-status--lg', !showLabel && 'tad-status--bare', className)}
      {...rest}
    >
      <span className="tad-status__dot" />
      {showLabel && <span>{text}</span>}
    </span>
  );
}

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  onRemove?: () => void;
}

export function Tag({ onRemove, className = '', children, ...rest }: TagProps) {
  return (
    <span className={cn('tad-tag', onRemove && 'tad-tag--removable', className)} {...rest}>
      {children}
      {onRemove && (
        <button type="button" className="tad-tag__x" aria-label="Remove" onClick={onRemove}>
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}
