import React from 'react';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';

const ADMIN_NAV: PortalNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/organisations', label: 'Organisations', icon: 'building' },
  { href: '/admin/devices', label: 'Devices', icon: 'cpu' },
  { href: '/admin/device-types', label: 'Device types', icon: 'tag' },
  { href: '/admin/incidents', label: 'Incidents', icon: 'alert', badge: 2 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tad">
      <div className="tad-portal">
        <PortalSidebar nav={ADMIN_NAV} user={{ name: 'Ayesha Khan', role: 'Admin', initials: 'AK' }} />
        <main className="tad-portal__main">{children}</main>
      </div>
    </div>
  );
}
