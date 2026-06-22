import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { INCIDENTS, type Incident } from '@/lib/portal-data';

const SEV: Record<Incident['severity'], 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral',
};
const STATUS: Record<Incident['status'], 'danger' | 'warning' | 'success'> = {
  open: 'danger', acknowledged: 'warning', resolved: 'success',
};

export default function AdminIncidentsPage() {
  return (
    <>
      <PortalTopbar title="Incidents" subtitle="Alerts raised across all devices" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Open', value: INCIDENTS.filter((i) => i.status === 'open').length },
          { label: 'Acknowledged', value: INCIDENTS.filter((i) => i.status === 'acknowledged').length },
          { label: 'Resolved', value: INCIDENTS.filter((i) => i.status === 'resolved').length },
        ]} />
        <DataTable<Incident>
          rows={INCIDENTS}
          columns={[
            { key: 'id', header: 'Incident', mono: true },
            { key: 'severity', header: 'Severity', render: (r) => <Badge variant={SEV[r.severity]}>{r.severity}</Badge> },
            { key: 'type', header: 'Type' },
            { key: 'device', header: 'Device IMEI', mono: true },
            { key: 'customer', header: 'Customer' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status]}>{r.status}</Badge> },
            { key: 'openedAt', header: 'Opened' },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">View</Button> },
          ]}
        />
      </div>
    </>
  );
}
