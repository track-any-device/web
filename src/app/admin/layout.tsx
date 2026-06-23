import React from 'react';
import { redirect } from 'next/navigation';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';
import { getSession } from '@/lib/auth';
import { ADMIN_ROLES, type Role } from '@/lib/portal-data';

const ADMIN_NAV: PortalNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/organisations', label: 'Organisations', icon: 'building' },
  { href: '/admin/devices', label: 'Devices', icon: 'cpu' },
  { href: '/admin/device-types', label: 'Device types', icon: 'tag' },
  { href: '/admin/exclusion-beats', label: 'Exclusion zones', icon: 'map' },
  { href: '/admin/incidents', label: 'Incidents', icon: 'alert' },
  { href: '/admin/sms', label: 'SMS', icon: 'message' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = String(session?.user?.role ?? '');
  if (!ADMIN_ROLES.includes(role as Role)) redirect('/my');
  const name = String(session?.user?.name ?? 'Admin');
  return (
    <div className="tad">
      <div className="tad-portal">
        <PortalSidebar nav={ADMIN_NAV} user={{ name, role: 'Admin', initials: name.slice(0, 2).toUpperCase() }} />
        <main className="tad-portal__main">{children}</main>
      </div>
    </div>
  );
}
