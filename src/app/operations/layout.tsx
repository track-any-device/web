import React from 'react';
import { redirect } from 'next/navigation';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';
import { getSession } from '@/lib/auth';
import { OPS_ROLES, type Role } from '@/lib/portal-data';

const OPS_NAV: PortalNavItem[] = [
  { href: '/operations/support', label: 'Support', icon: 'bell' },
  { href: '/operations/procurement', label: 'Procurement', icon: 'box' },
  { href: '/operations/workshop', label: 'Workshop', icon: 'wrench' },
  { href: '/operations/orders', label: 'Orders', icon: 'truck' },
];

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = String(session?.user?.role ?? '');
  if (!OPS_ROLES.includes(role as Role)) redirect('/my');
  const name = String(session?.user?.name ?? 'Operations');
  return (
    <div className="tad">
      <div className="tad-portal">
        <PortalSidebar nav={OPS_NAV} user={{ name, role: 'Operations', initials: name.slice(0, 2).toUpperCase() }} />
        <main className="tad-portal__main">{children}</main>
      </div>
    </div>
  );
}
