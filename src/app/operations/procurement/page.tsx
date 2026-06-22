import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button, Input } from '@/components/ui';
import { DEVICES, type Device } from '@/lib/portal-data';

const STATUS: Record<Device['status'], 'success' | 'warning' | 'danger'> = {
  active: 'success', pending: 'warning', blocked: 'danger',
};

export default function ProcurementPage() {
  return (
    <>
      <PortalTopbar
        title="Procurement — Device inventory"
        subtitle="Register incoming devices by IMEI"
        right={<Button size="sm">Register device</Button>}
      />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'In inventory', value: DEVICES.length },
          { label: 'Awaiting SIM', value: DEVICES.filter((d) => !d.sim).length },
          { label: 'Linked to orders', value: DEVICES.filter((d) => d.deliveryOrder).length },
        ]} />

        <div className="tad-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-4)', alignItems: 'end' }}>
          <Input label="Device IMEI" mono placeholder="Scan or type the IMEI" />
          <Input label="Model" placeholder="e.g. Concox GT06N" />
          <Button>Add to inventory</Button>
        </div>

        <DataTable<Device>
          rows={DEVICES}
          columns={[
            { key: 'imei', header: 'IMEI', mono: true },
            { key: 'model', header: 'Model' },
            { key: 'category', header: 'Type' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status]}>{r.status}</Badge> },
            { key: 'deliveryOrder', header: 'Delivery order', mono: true, render: (r) => r.deliveryOrder ?? '—' },
          ]}
        />
      </div>
    </>
  );
}
