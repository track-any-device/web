'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/tad/logo';
import { SiteFooter } from '@/components/tad/site-footer';
import { UserMenu } from '@/components/tad/user-menu';
import { getAuthUser } from '@/lib/auth-store';

/* Customer portal chrome (/my) — TAD-PAK header + shared web footer, scoped under .tad so the
   design tokens apply. Renders inside MyShell (the auth gate). The avatar UserMenu carries the
   links into the public site and (for staff) the /operations and /admin portals. */

const NAV = [
  { label: 'Devices', href: '/my/devices' },
  { label: 'Orders', href: '/my/orders' },
  { label: 'Profile', href: '/my/profile' },
];

export function MyPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const [user, setUser] = React.useState<{ name: string; role: string }>({ name: 'My account', role: '' });
  React.useEffect(() => {
    const u = getAuthUser();
    setUser({ name: String(u?.name ?? 'My account'), role: String(u?.role ?? '') });
  }, []);
  // The devices/stream pages are full-bleed map apps — they manage their own height and must not
  // sit inside the centered, padded content container the other /my pages use. /my/trips and
  // /my/beats render the SAME map app (DevicesView) on a different tab, so they must be full-bleed
  // too — otherwise they'd get the container's padding + footer on top of DevicesView's own
  // wrapper, breaking spacing symmetry with /my/devices. Match those two list routes exactly so the
  // padded /my/beats sub-pages (create / [id] edit forms) keep the centered container.
  const fullBleed =
    pathname.startsWith('/my/devices') ||
    pathname.startsWith('/my/stream') ||
    pathname === '/my/trips' ||
    pathname === '/my/beats';

  return (
    <div className="tad" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="tad-header">
        <div className="tad-shell__bar">
          <Link href="/my/devices" aria-label="TAD-PAK" className="tad-shell__logo"><Logo /></Link>
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
          <div className="tad-shell__actions">
            <UserMenu name={user.name} role={user.role} />
          </div>
        </div>
      </header>

      <main
        style={fullBleed
          ? { flex: 1, width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }
          : { flex: 1, width: '100%', maxWidth: 'var(--container-xl)', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}
      >
        {children}
      </main>

      {!fullBleed && <SiteFooter />}
    </div>
  );
}
