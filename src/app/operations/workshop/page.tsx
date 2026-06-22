import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { DEVICES, type Device } from '@/lib/portal-data';

export default async function WorkshopPage() {
  const all = await fetchPortal<Device[]>('/ops/devices', DEVICES);
  const queue = all.filter((d) => !d.sim || d.status === 'pending');
  return (
    <>
      <PortalTopbar title="Workshop — SIM & configuration" subtitle="Assign SIMs and push device configuration" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Awaiting SIM', value: all.filter((d) => !d.sim).length },
          { label: 'In queue', value: queue.length },
          { label: 'Configured', value: all.filter((d) => d.sim && d.status === 'active').length },
        ]} />
        <DataTable<Device>
          rows={queue}
          empty="Nothing in the workshop queue."
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
            { key: 'sim', header: 'SIM', mono: true, render: (r) => r.sim ?? <Badge variant="warning">No SIM</Badge> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'pending' ? 'warning' : 'success'}>{r.status}</Badge> },
            { key: 'act', header: '', align: 'right', render: (r) => (
              <span style={{ display: 'inline-flex', gap: 8 }}>
                {!r.sim && <Button variant="secondary" size="sm">Assign SIM</Button>}
                <Button size="sm">Configure</Button>
              </span>
            ) },
          ]}
        />
      </div>
    </>
  );
}
