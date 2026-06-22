'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/tad/logo';
import { clearAuth, getAuthUser } from '@/lib/auth-store';
import { OPS_ROLES, ADMIN_ROLES, type Role } from '@/lib/portal-data';

/* Customer portal chrome (/my) — TAD-PAK header + footer, scoped under .tad so the design
   tokens apply. Renders inside MyShell (the auth gate). Staff also get links into their
   /operations and /admin portals (which are otherwise unreachable from the UI). */

const NAV = [
  { label: 'Devices', href: '/my/devices' },
  { label: 'Orders', href: '/my/orders' },
  { label: 'Profile', href: '/my/profile' },
];

export function MyPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [role, setRole] = React.useState('');
  React.useEffect(() => { setRole(String(getAuthUser()?.role ?? '')); }, []);
  const isOps = OPS_ROLES.includes(role as Role);
  const isAdmin = ADMIN_ROLES.includes(role as Role);

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore — clear locally regardless */
    }
    clearAuth();
    window.location.href = '/login';
  }

  return (
    <div className="tad" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="tad-header">
        <div className="tad-shell__bar">
          <Link href="/my/devices" aria-label="TAD-PAK"><Logo /></Link>
          <nav className="tad-shell__nav">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="tad-nav-link"
                aria-current={pathname.startsWith(n.href) ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <span className="tad-shell__spacer" />
          <div className="tad-shell__actions">
            {isOps && <Link href="/operations" className="tad-btn tad-btn--ghost tad-btn--sm">Operations</Link>}
            {isAdmin && <Link href="/admin" className="tad-btn tad-btn--ghost tad-btn--sm">Admin</Link>}
            <button type="button" className="tad-btn tad-btn--ghost tad-btn--sm" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 'var(--container-xl)', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {children}
      </main>

      <footer className="tad-footer">
        <div className="tad-footer__inner">
          <div className="tad-footer__legal">
            <span>© {new Date().getFullYear()} TAD-PAK GPS</span>
            <span className="tad-data">Cash on delivery · PKR · Pakistan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
