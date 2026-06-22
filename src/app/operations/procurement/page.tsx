import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button, Input } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type Device } from '@/lib/portal-data';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', blocked: 'danger' };

export default async function ProcurementPage() {
  await requirePortal('procurement');
  const { data: rows, error } = await fetchPortal<Device>('/ops/devices');
  return (
    <>
      <PortalTopbar title="Procurement — Device inventory" subtitle="Register incoming devices by IMEI" right={<Button size="sm">Register device</Button>} />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'In inventory', value: rows.length },
          { label: 'Awaiting SIM', value: rows.filter((d) => !d.sim).length },
          { label: 'Active', value: rows.filter((d) => d.status === 'active').length },
        ]} />
        <div className="tad-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-4)', alignItems: 'end' }}>
          <Input label="Device IMEI" mono placeholder="Scan or type the IMEI" />
          <Input label="Model" placeholder="e.g. Concox GT06N" />
          <Button>Add to inventory</Button>
        </div>
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
