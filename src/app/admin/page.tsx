import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { StatRow } from '@/components/tad/data-table';
import { Card, Badge } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { type Device, type PortalUser, type Tenant, type Incident, type DeliveryOrder, type DeviceType } from '@/lib/portal-data';

export default async function AdminDashboard() {
  const [devicesR, usersR, tenantsR, incidentsR, ordersR, typesR] = await Promise.all([
    fetchPortal<Device>('/admin/devices'),
    fetchPortal<PortalUser>('/admin/users'),
    fetchPortal<Tenant>('/admin/tenants'),
    fetchPortal<Incident>('/admin/incidents'),
    fetchPortal<DeliveryOrder>('/ops/orders'),
    fetchPortal<DeviceType>('/admin/device-types'),
  ]);
  const devices = devicesR.data, users = usersR.data, tenants = tenantsR.data;
  const incidents = incidentsR.data, orders = ordersR.data, types = typesR.data;
  const links = [
    { href: '/admin/users', label: 'Users', n: users.length },
    { href: '/admin/organisations', label: 'Organisations', n: tenants.length },
    { href: '/admin/devices', label: 'Devices', n: devices.length },
    { href: '/admin/device-types', label: 'Device types', n: types.length },
    { href: '/admin/incidents', label: 'Incidents', n: incidents.filter((i) => i.status !== 'resolved').length },
  ];
  return (
    <>
      <PortalTopbar title="Admin" subtitle="Platform overview" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Active devices', value: devices.filter((d) => d.status === 'active').length, hint: `${devices.length} total` },
          { label: 'Organisations', value: tenants.length, hint: `${tenants.filter((t) => t.hasKey).length} with key` },
          { label: 'Open incidents', value: incidents.filter((i) => i.status !== 'resolved').length },
          { label: 'Orders', value: orders.length },
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
