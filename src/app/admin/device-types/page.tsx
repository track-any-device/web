import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { DEVICE_TYPES, type DeviceType } from '@/lib/portal-data';

export default async function AdminDeviceTypesPage() {
  const rows = await fetchPortal<DeviceType[]>('/admin/device-types', DEVICE_TYPES);
  return (
    <>
      <PortalTopbar title="Device types" subtitle="The sellable catalogue — synced to Sanity" right={<Button size="sm">New device type</Button>} />
      <div className="tad-portal__body">
        <DataTable<DeviceType>
          rows={rows}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'slug', header: 'Slug', mono: true },
            { key: 'originalModel', header: 'Driver model', mono: true, render: (r) => r.originalModel ?? '—' },
            { key: 'pricePkr', header: 'Price', align: 'right', mono: true, render: (r) => r.pricePkr != null ? `Rs ${r.pricePkr.toLocaleString()}` : '—' },
            { key: 'active', header: 'Status', render: (r) => <Badge variant={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Hidden'}</Badge> },
          ]}
        />
      </div>
    </>
  );
}
