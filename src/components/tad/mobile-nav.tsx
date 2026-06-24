'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogIn } from 'lucide-react';
import { SITE_NAV } from './site-nav';

/* Mobile site navigation — the desktop `.tad-shell__nav` is hidden below the nav breakpoint
   (see tad.css), so phones/tablets get this hamburger → slide-in drawer instead. Exposes
   SITE_NAV plus the auth action. Client component (toggle state + outside-click/Escape/route
   change closing); rendered by the async SiteShell server component. Styling: .tad-mnav* in tad.css. */

export interface MobileNavProps {
  /** Whether a session exists — drives the auth row (Account vs Sign in). */
  signedIn: boolean;
  /** Display name for the signed-in account row. */
  userName?: string;
  dark?: boolean;
}

export function MobileNav({ signedIn, userName, dark = false }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close on route change.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + close on Escape while the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="tad-mnav" data-theme={dark ? 'dark' : undefined}>
      <button
        type="button"
        className="tad-mnav__toggle"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} strokeWidth={2} aria-hidden />
      </button>

      {open && (
        <>
          <div className="tad-mnav__scrim" onClick={() => setOpen(false)} aria-hidden />
          <div className="tad-mnav__sheet" role="dialog" aria-modal="true" aria-label="Site navigation">
            <div className="tad-mnav__head">
              <span className="tad-eyebrow">Menu</span>
              <button
                type="button"
                className="tad-mnav__close"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <nav className="tad-mnav__links" aria-label="Primary">
              {SITE_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="tad-mnav__link"
                  aria-current={isActive(n.href) ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="tad-mnav__divider" />

            {signedIn ? (
              <Link href="/my" className="tad-mnav__account" onClick={() => setOpen(false)}>
                <span className="tad-usermenu__avatar" aria-hidden>
                  <User size={16} strokeWidth={2} />
                </span>
                <span className="tad-mnav__account-text">
                  <span className="tad-mnav__account-name">{userName || 'My account'}</span>
                  <span className="tad-mnav__account-hint">Devices, orders &amp; profile</span>
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="tad-btn tad-btn--primary tad-btn--lg tad-btn--block"
                onClick={() => setOpen(false)}
              >
                <LogIn size={18} strokeWidth={2} aria-hidden />
                Sign in
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
