import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Logo } from './logo';
import { SiteFooter } from './site-footer';
import { PageTransition } from './page-transition';
import { UserMenu } from './user-menu';
import { SITE_NAV } from './site-nav';
import { getSession } from '@/lib/auth';

/* TAD-PAK site shell — sticky blurred header + footer, wraps page content in a `.tad` root
   so design-system tokens resolve. Marketing + customer-portal surfaces render inside this.
   The header is session-aware: signed-in visitors get the avatar menu, otherwise a sign-in icon. */

export interface SiteShellProps {
  children: React.ReactNode;
  /** Night theme (dark map / driving mode). */
  dark?: boolean;
}

export async function SiteShell({ children, dark = false }: SiteShellProps) {
  const session = await getSession();
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
            {SITE_NAV.map((n) => (
              <Link key={n.href} href={n.href} className="tad-nav-link">{n.label}</Link>
            ))}
          </nav>
          <div className="tad-shell__actions">
            {session?.user ? (
              <UserMenu name={String(session.user.name ?? 'Account')} role={String(session.user.role ?? '')} />
            ) : (
              <Link href="/login" aria-label="Sign in" className="tad-usermenu__trigger" style={{ padding: 2 }}>
                <span className="tad-usermenu__avatar" aria-hidden><User size={16} strokeWidth={2} /></span>
              </Link>
            )}
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
