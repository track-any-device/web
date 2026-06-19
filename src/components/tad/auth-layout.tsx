import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';

/* Centered auth card layout (sign-in / OTP / register) on the warm TAD-PAK background. */

export interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="tad" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center', padding: 'var(--space-6)', position: 'relative' }}>
      <div className="tad-dot-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, display: 'grid', gap: 'var(--space-6)', justifyItems: 'center' }}>
        <Link href="/" aria-label="TAD-PAK home"><Logo /></Link>
        <div className="tad-card tad-card--raised" style={{ width: '100%' }}>
          <div className="tad-card__body">
            {(title || subtitle) && (
              <header style={{ display: 'grid', gap: 4, marginBottom: 'var(--space-5)', textAlign: 'center' }}>
                {title && <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{title}</h1>}
                {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{subtitle}</p>}
              </header>
            )}
            {children}
          </div>
        </div>
        {footer && <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>{footer}</p>}
      </div>
    </div>
  );
}
