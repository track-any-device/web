import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { HeartbeatCell } from '@/components/tad/heartbeat';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { type Device } from '@/lib/portal-data';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', blocked: 'danger' };

export default async function AdminDevicesPage() {
  const { data: rows, error } = await fetchPortal<Device>('/admin/devices');
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
          empty={error ?? 'No devices yet.'}
          rows={rows}
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
            { key: 'sim', header: 'SIM', mono: true, render: (r) => r.sim ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status] ?? 'neutral'}>{r.status}</Badge> },
            { key: 'owner', header: 'Owner', render: (r) => r.owner ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span> },
            { key: 'lastSeen', header: 'Last seen', render: (r) => r.lastSeen ?? '—' },
            { key: 'heartbeat', header: 'Heartbeat', render: (r) => <HeartbeatCell online={r.online} at={r.heartbeatAt} intervalS={r.heartbeatIntervalS} /> },
            { key: 'act', header: '', align: 'right', render: (r) => <Link href={`/admin/devices/${r.id}`}><Button variant="ghost" size="sm">View</Button></Link> },
          ]}
        />
      </div>
    </>
  );
}
