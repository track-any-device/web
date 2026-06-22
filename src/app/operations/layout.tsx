import React from 'react';
import { PortalSidebar, type PortalNavItem } from '@/components/tad/portal-shell';

const OPS_NAV: PortalNavItem[] = [
  { href: '/operations/support', label: 'Support', icon: 'bell', badge: 2 },
  { href: '/operations/procurement', label: 'Procurement', icon: 'box' },
  { href: '/operations/workshop', label: 'Workshop', icon: 'wrench' },
  { href: '/operations/orders', label: 'Orders', icon: 'truck' },
];

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="tad">
      <div className="tad-portal">
        <PortalSidebar nav={OPS_NAV} user={{ name: 'Zara Sheikh', role: 'Operations', initials: 'ZS' }} />
        <main className="tad-portal__main">{children}</main>
      </div>
    </div>
  );
}
