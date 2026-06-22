import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { TENANTS, type Tenant } from '@/lib/portal-data';

const STATUS: Record<Tenant['status'], 'success' | 'warning' | 'danger'> = {
  approved: 'success', pending: 'warning', rejected: 'danger',
};

export default function AdminOrganisationsPage() {
  return (
    <>
      <PortalTopbar title="Organisations" subtitle="Tenant accounts (B2B fleets)" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Approved', value: TENANTS.filter((t) => t.status === 'approved').length },
          { label: 'Pending approval', value: TENANTS.filter((t) => t.status === 'pending').length },
          { label: 'Devices managed', value: TENANTS.reduce((n, t) => n + t.devices, 0) },
        ]} />
        <DataTable<Tenant>
          rows={TENANTS}
          columns={[
            { key: 'name', header: 'Organisation' },
            { key: 'slug', header: 'Subdomain', mono: true, render: (r) => `${r.slug}.track-any-device.com` },
            { key: 'devices', header: 'Devices', align: 'center' },
            { key: 'members', header: 'Members', align: 'center' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status]}>{r.status}</Badge> },
            { key: 'act', header: '', align: 'right', render: (r) => r.status === 'pending' ? <Button size="sm">Approve</Button> : <Button variant="ghost" size="sm">Manage</Button> },
          ]}
        />
      </div>
    </>
  );
}
