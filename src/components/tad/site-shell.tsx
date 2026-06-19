import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';

/* TAD-PAK site shell — sticky blurred header + footer, wraps page content in a `.tad` root
   so design-system tokens resolve. Marketing + customer-portal surfaces render inside this. */

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'For business', href: '/business' },
  { label: 'Support', href: '/support' },
];

const FOOTER_COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Track',
    links: [
      { label: 'Car tracking', href: '/shop?category=car' },
      { label: 'Bike tracking', href: '/shop?category=bike' },
      { label: 'Person trackers', href: '/shop?category=person' },
      { label: 'For business', href: '/business' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Stores', href: '/stores' },
      { label: 'Contact', href: '/contact' },
      { label: 'Help center', href: '/support' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Sign in', href: '/login' },
      { label: 'My devices', href: '/my' },
      { label: 'Track an order', href: '/my/orders' },
      { label: 'Status', href: '/status' },
    ],
  },
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
          <Link href="/" aria-label="TAD-PAK home"><Logo dark={dark} /></Link>
          <nav className="tad-shell__nav">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="tad-nav-link">{n.label}</Link>
            ))}
          </nav>
          <span className="tad-shell__spacer" />
          <div className="tad-shell__actions">
            <Link href="/login" className="tad-btn tad-btn--ghost tad-btn--sm">Sign in</Link>
            <Link href="/my" className="tad-btn tad-btn--primary tad-btn--sm">My devices</Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer className="tad-footer">
        <div className="tad-footer__inner">
          <div className="tad-footer__cols">
            <div>
              <Logo dark={dark} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 260, marginTop: 12 }}>
                Always know where everything is — friendly real-time GPS tracking for your car, bike,
                and team across Pakistan.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <div className="tad-footer__heading">{col.heading}</div>
                {col.links.map((l) => (
                  <Link key={l.href} href={l.href} className="tad-foot-link">{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
          <div className="tad-footer__legal">
            <span>© {new Date().getFullYear()} TAD-PAK GPS. All rights reserved.</span>
            <span className="tad-data">Cash on delivery · PKR · Pakistan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
