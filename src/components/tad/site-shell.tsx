import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { Logo } from './logo';
import { SiteFooter } from './site-footer';
import { PageTransition } from './page-transition';
import { UserMenu } from './user-menu';
import { CartButton } from './cart-button';
import { MobileNav } from './mobile-nav';
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
  const userName = String(session?.user?.name ?? 'Account');
  return (
    <div
      className="tad flex min-h-screen flex-col"
      data-theme={dark ? 'dark' : undefined}
      style={{ background: 'var(--bg)' }}
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
            <CartButton />
            {session?.user ? (
              <UserMenu name={userName} role={String(session.user.role ?? '')} />
            ) : (
              <Link href="/login" aria-label="Sign in" className="tad-shell__signin tad-usermenu__trigger">
                <span className="tad-usermenu__avatar" aria-hidden><User size={16} strokeWidth={2} /></span>
              </Link>
            )}
            <MobileNav signedIn={Boolean(session?.user)} userName={userName} dark={dark} />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>

      <SiteFooter dark={dark} loggedIn={Boolean(session?.user)} />
    </div>
  );
}
