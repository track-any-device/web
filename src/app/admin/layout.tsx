import React from 'react';
import { redirect } from 'next/navigation';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';
import { PortalMobileNav } from '@/components/tad/portal-mobile-nav';
import { LoadingProvider } from '@/components/tad/loading-provider';
import { getSession } from '@/lib/auth';
import { ADMIN_ROLES, type Role } from '@/lib/portal-data';

const ADMIN_NAV: PortalNavItem[] = [
  {
    href: '/admin',
    label: 'Dashboards',
    icon: 'grid',
    exact: true,
    children: [
      { href: '/admin', label: 'Overview', icon: 'grid', exact: true },
      { href: '/admin/dashboards/fleet', label: 'Fleet', icon: 'cpu' },
      { href: '/admin/dashboards/operations', label: 'Operations', icon: 'alert' },
      { href: '/admin/dashboards/support', label: 'Support', icon: 'bell' },
      { href: '/admin/dashboards/integrations', label: 'Integrations', icon: 'message' },
      { href: '/admin/dashboards/customers', label: 'Customers', icon: 'users' },
    ],
  },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/organisations', label: 'Organisations', icon: 'building' },
  { href: '/admin/devices', label: 'Devices', icon: 'cpu' },
  { href: '/admin/device-types', label: 'Device types', icon: 'tag' },
  { href: '/admin/exclusion-beats', label: 'Exclusion zones', icon: 'map' },
  { href: '/admin/incidents', label: 'Alerts', icon: 'alert' },
  { href: '/admin/sms', label: 'SMS', icon: 'message' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = String(session?.user?.role ?? '');
  if (!ADMIN_ROLES.includes(role as Role)) redirect('/my');
  const name = String(session?.user?.name ?? 'Admin');
  const user = { name, role, initials: name.slice(0, 2).toUpperCase() };
  return (
    <div className="tad">
      <div className="tad-portal">
        {/* lg+ persistent sidebar (hidden below lg via tad.css). */}
        <PortalSidebar nav={ADMIN_NAV} user={user} />
        {/* position:relative so the LoadingProvider's absolute satellite overlay covers
            ONLY this content pane (the sidebar stays visible). */}
        <main className="tad-portal__main" style={{ position: 'relative' }}>
          {/* Below lg: sticky hamburger bar + slide-in drawer (same nav). Hidden at lg+. */}
          <PortalMobileNav nav={ADMIN_NAV} user={user} />
          <LoadingProvider>{children}</LoadingProvider>
        </main>
      </div>
    </div>
  );
}
