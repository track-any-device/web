import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { DEVICES, type Device } from '@/lib/portal-data';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', blocked: 'danger' };

export default async function AdminDevicesPage() {
  const rows = await fetchPortal<Device[]>('/admin/devices', DEVICES);
  return (
    <>
      <PortalTopbar title="Devices" subtitle="Every device on the platform" right={<Button size="sm">Export</Button>} />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Active', value: rows.filter((d) => d.status === 'active').length },
          { label: 'Pending', value: rows.filter((d) => d.status === 'pending').length },
          { label: 'Blocked', value: rows.filter((d) => d.status === 'blocked').length },
        ]} />
        {/* SIM is admin-only per the privacy rules — never shown in tenant/my portals. */}
        <DataTable<Device>
          rows={rows}
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
            { key: 'sim', header: 'SIM', mono: true, render: (r) => r.sim ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status] ?? 'neutral'}>{r.status}</Badge> },
            { key: 'owner', header: 'Owner', render: (r) => r.owner ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
            { key: 'lastSeen', header: 'Last seen', render: (r) => r.lastSeen ?? '—' },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">View</Button> },
          ]}
        />
      </div>
    </>
  );
}
