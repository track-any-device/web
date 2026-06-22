import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { DEVICE_TYPES, type DeviceType } from '@/lib/portal-data';

export default function AdminDeviceTypesPage() {
  return (
    <>
      <PortalTopbar
        title="Device types"
        subtitle="The sellable catalogue — synced to Sanity"
        right={<Button size="sm">New device type</Button>}
      />
      <div className="tad-portal__body">
        <DataTable<DeviceType>
          rows={DEVICE_TYPES}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'slug', header: 'Slug', mono: true },
            { key: 'originalModel', header: 'Driver model', mono: true },
            { key: 'category', header: 'Category' },
            { key: 'protocol', header: 'Protocol', render: (r) => <Badge variant="neutral" mono>{r.protocol}</Badge> },
            { key: 'pricePkr', header: 'Price', align: 'right', mono: true, render: (r) => `Rs ${r.pricePkr.toLocaleString()}` },
            { key: 'active', header: 'Status', render: (r) => <Badge variant={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Hidden'}</Badge> },
          ]}
        />
      </div>
    </>
  );
}
