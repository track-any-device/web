import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { StatRow } from '@/components/tad/data-table';
import { Card, Badge } from '@/components/ui';
import { DEVICES, USERS, TENANTS, INCIDENTS, ORDERS } from '@/lib/portal-data';

export default function AdminDashboard() {
  const links = [
    { href: '/admin/users', label: 'Users', n: USERS.length },
    { href: '/admin/organisations', label: 'Organisations', n: TENANTS.length },
    { href: '/admin/devices', label: 'Devices', n: DEVICES.length },
    { href: '/admin/device-types', label: 'Device types', n: 5 },
    { href: '/admin/incidents', label: 'Incidents', n: INCIDENTS.filter((i) => i.status !== 'resolved').length },
  ];
  return (
    <>
      <PortalTopbar title="Admin" subtitle="Platform overview" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Active devices', value: DEVICES.filter((d) => d.status === 'active').length, hint: `${DEVICES.length} total` },
          { label: 'Organisations', value: TENANTS.filter((t) => t.status === 'approved').length, hint: `${TENANTS.filter((t) => t.status === 'pending').length} pending` },
          { label: 'Open incidents', value: INCIDENTS.filter((i) => i.status !== 'resolved').length },
          { label: 'Orders today', value: ORDERS.length },
        ]} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-5)' }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
              <Card style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{l.label}</span>
                <Badge variant="neutral" mono>{l.n}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
