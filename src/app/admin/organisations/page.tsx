import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { TENANTS, type Tenant } from '@/lib/portal-data';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { approved: 'success', pending: 'warning', rejected: 'danger' };

export default async function AdminOrganisationsPage() {
  const rows = await fetchPortal<Tenant[]>('/admin/tenants', TENANTS);
  return (
    <>
      <PortalTopbar title="Organisations" subtitle="Tenant accounts (B2B fleets)" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Approved', value: rows.filter((t) => t.status === 'approved').length },
          { label: 'Pending approval', value: rows.filter((t) => t.status === 'pending').length },
          { label: 'Devices managed', value: rows.reduce((n, t) => n + t.devices, 0) },
        ]} />
        <DataTable<Tenant>
          rows={rows}
          columns={[
            { key: 'name', header: 'Organisation' },
            { key: 'slug', header: 'Subdomain', mono: true, render: (r) => `${r.slug}.track-any-device.com` },
            { key: 'devices', header: 'Devices', align: 'center' },
            { key: 'members', header: 'Members', align: 'center' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status] ?? 'neutral'}>{r.status}</Badge> },
            { key: 'act', header: '', align: 'right', render: (r) => r.status === 'pending' ? <Button size="sm">Approve</Button> : <Button variant="ghost" size="sm">Manage</Button> },
          ]}
        />
      </div>
    </>
  );
}
