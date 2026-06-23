import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type Device } from '@/lib/portal-data';
import { AddDevice } from './add-device';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', blocked: 'danger' };

export default async function ProcurementPage() {
  await requirePortal('procurement');
  const { data: rows, error } = await fetchPortal<Device>('/ops/devices');
  return (
    <>
      <PortalTopbar title="Procurement — Device inventory" subtitle="Register incoming devices by IMEI" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'In inventory', value: rows.length },
          { label: 'Awaiting SIM', value: rows.filter((d) => !d.sim).length },
          { label: 'Active', value: rows.filter((d) => d.status === 'active').length },
        ]} />
        <AddDevice />
        <DataTable<Device>
          empty={error ?? 'No devices to procure yet.'}
          rows={rows}
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model', render: (r) => r.model ?? '—' },
            { key: 'sim', header: 'SIM', mono: true, render: (r) => r.sim ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status] ?? 'neutral'}>{r.status}</Badge> },
            { key: 'owner', header: 'Owner', render: (r) => r.owner ?? '—' },
          ]}
        />
      </div>
    </>
  );
}
