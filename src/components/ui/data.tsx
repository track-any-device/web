'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — Data (Card, Metric). Styles in src/styles/tad.css. */

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  raised?: boolean;
  interactive?: boolean;
  accent?: boolean;
  flushBody?: boolean;
}

export function Card({
  title,
  action,
  footer,
  raised = false,
  interactive = false,
  accent = false,
  flushBody = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'tad-card',
        raised && 'tad-card--raised',
        interactive && 'tad-card--interactive',
        accent && 'tad-card--accent',
        className,
      )}
      {...rest}
    >
      {(title || action) && (
        <div className="tad-card__header">
          {typeof title === 'string' ? <span className="tad-card__title">{title}</span> : title}
          {action}
        </div>
      )}
      <div className={cn('tad-card__body', flushBody && 'tad-card__body--flush')}>{children}</div>
      {footer && <div className="tad-card__footer">{footer}</div>}
    </div>
  );
}

export type MetricTrend = 'up' | 'down' | 'flat';

export interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  value?: React.ReactNode;
  unit?: React.ReactNode;
  delta?: React.ReactNode;
  trend?: MetricTrend;
  size?: 'sm' | 'md';
}

function Arrow({ dir }: { dir: MetricTrend }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      {dir === 'flat'
        ? <path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        : <path d={dir === 'up' ? 'M6 2v8M6 2L3 5M6 2l3 3' : 'M6 10V2M6 10L3 7M6 10l3-3'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function Metric({ label, value, unit, delta, trend, size = 'md', className = '', ...rest }: MetricProps) {
  const dir: MetricTrend | null = trend || (delta != null ? (String(delta).trim().startsWith('-') ? 'down' : 'up') : null);
  return (
    <div className={cn('tad-metric', size === 'sm' && 'tad-metric--sm', className)} {...rest}>
      {label && <span className="tad-metric__label">{label}</span>}
      <span className="tad-metric__value">
        {value}
        {unit && <span className="tad-metric__unit">{unit}</span>}
      </span>
      {delta != null && dir && (
        <span className={cn('tad-metric__delta', `tad-metric__delta--${dir}`)}>
          <Arrow dir={dir} />
          {delta}
        </span>
      )}
    </div>
  );
}
