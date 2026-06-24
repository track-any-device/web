import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { SiteFooter } from './site-footer';
import { PageTransition } from './page-transition';

/* TAD-PAK site shell — sticky blurred header + footer, wraps page content in a `.tad` root
   so design-system tokens resolve. Marketing + customer-portal surfaces render inside this. */

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'For business', href: '/business' },
  { label: 'Support', href: '/support' },
];

export interface SiteShellProps {
  children: React.ReactNode;
  /** Night theme (dark map / driving mode). */
  dark?: boolean;
}

export function SiteShell({ children, dark = false }: SiteShellProps) {
  return (
    <div
      className="tad"
      data-theme={dark ? 'dark' : undefined}
      style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <header className="tad-header">
        <div className="tad-shell__bar">
          <Link href="/" aria-label="TAD-PAK home" className="tad-shell__logo"><Logo dark={dark} /></Link>
          <nav className="tad-shell__nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="tad-nav-link">{n.label}</Link>
            ))}
          </nav>
          <div className="tad-shell__actions">
            <Link href="/login" className="tad-btn tad-btn--ghost tad-btn--sm">Sign in</Link>
            <Link href="/my" className="tad-btn tad-btn--primary tad-btn--sm">My devices</Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <PageTransition>{children}</PageTransition>
      </main>

      <SiteFooter dark={dark} />
    </div>
  );
}
