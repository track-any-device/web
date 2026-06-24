import React from 'react';
import { redirect } from 'next/navigation';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';
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
  return (
    <div className="tad">
      <div className="tad-portal">
        <PortalSidebar nav={nav} user={{ name, role, initials: name.slice(0, 2).toUpperCase() }} />
        <main className="tad-portal__main">{children}</main>
      </div>
    </div>
  );
}
