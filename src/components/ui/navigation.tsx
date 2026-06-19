'use client';
import React from 'react';
import { cn } from '@/lib/cn';

/* TAD-PAK design system — Navigation (Tabs). Styles in src/styles/tad.css. */

export type TabItem =
  | string
  | { value: string; label: React.ReactNode; icon?: React.ReactNode; count?: number };

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items?: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'line' | 'pill';
}

export function Tabs({ items = [], value, onChange, variant = 'line', className = '', ...rest }: TabsProps) {
  return (
    <div className={cn('tad-tabs', `tad-tabs--${variant}`, className)} role="tablist" {...rest}>
      {items.map((it) => {
        const id = typeof it === 'string' ? it : it.value;
        const label = typeof it === 'string' ? it : it.label;
        const icon = typeof it === 'string' ? null : it.icon;
        const count = typeof it === 'string' ? null : it.count;
        const selected = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className="tad-tab"
            onClick={() => onChange?.(id)}
          >
            {icon}
            {label}
            {count != null && <span className="tad-tab__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
