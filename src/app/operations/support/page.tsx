import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { INCIDENTS, type Incident } from '@/lib/portal-data';

const SEV: Record<Incident['severity'], 'danger' | 'warning' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral',
};

export default function SupportPage() {
  return (
    <>
      <PortalTopbar title="Support — Incident watch" subtitle="Live incidents across all customers" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Open incidents', value: INCIDENTS.filter((i) => i.status !== 'resolved').length },
          { label: 'Critical', value: INCIDENTS.filter((i) => i.severity === 'critical').length },
          { label: 'Resolved today', value: INCIDENTS.filter((i) => i.status === 'resolved').length },
        ]} />
        <DataTable<Incident>
          rows={INCIDENTS}
          columns={[
            { key: 'id', header: 'Incident', mono: true },
            { key: 'severity', header: 'Severity', render: (r) => <Badge variant={SEV[r.severity]}>{r.severity}</Badge> },
            { key: 'type', header: 'Type' },
            { key: 'customer', header: 'Customer' },
            { key: 'location', header: 'Location' },
            { key: 'openedAt', header: 'Opened' },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">Call customer</Button> },
          ]}
        />
      </div>
    </>
  );
}
