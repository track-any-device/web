import React from 'react';
import { redirect } from 'next/navigation';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';
import { PortalMobileNav } from '@/components/tad/portal-mobile-nav';
import { LoadingProvider } from '@/components/tad/loading-provider';
import { getSession } from '@/lib/auth';
import { accessiblePortals } from '@/lib/portal-data';

const OPS_NAV: PortalNavItem[] = [
  { href: '/operations/support', label: 'Support', icon: 'bell' },
  { href: '/operations/procurement', label: 'Procurement', icon: 'box' },
  { href: '/operations/workshop', label: 'Workshop', icon: 'wrench' },
  { href: '/operations/orders', label: 'Orders', icon: 'truck' },
];

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = String(session?.user?.role ?? '');
  const allowed = accessiblePortals(role);
  if (allowed.length === 0) redirect('/my');

  // Each role sees only the portals it can access (procurement -> Procurement only; admin/core -> all).
  const nav = OPS_NAV.filter((n) => allowed.includes(n.href.split('/').pop() as string));
  const name = String(session?.user?.name ?? 'Operations');
  const user = { name, role, initials: name.slice(0, 2).toUpperCase() };
  return (
    <div className="tad">
      <div className="tad-portal">
        {/* lg+ persistent sidebar (hidden below lg via tad.css). */}
        <PortalSidebar nav={nav} user={user} />
        {/* position:relative so the LoadingProvider's absolute satellite overlay covers
            ONLY this content pane (the sidebar stays visible). */}
        <main className="tad-portal__main" style={{ position: 'relative' }}>
          {/* Below lg: sticky hamburger bar + slide-in drawer (same nav). Hidden at lg+. */}
          <PortalMobileNav nav={nav} user={user} />
          <LoadingProvider>{children}</LoadingProvider>
        </main>
      </div>
    </div>
  );
}
