import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { INCIDENTS, eventLabel, type Incident } from '@/lib/portal-data';

const PRIORITY: Record<string, 'danger' | 'warning' | 'neutral'> = { critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral', info: 'neutral' };

export default async function SupportPage() {
  const rows = await fetchPortal<Incident[]>('/ops/incidents', INCIDENTS);
  return (
    <>
      <PortalTopbar title="Support — Incident watch" subtitle="Live incidents across all customers" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Open incidents', value: rows.filter((i) => i.status !== 'resolved').length },
          { label: 'Critical', value: rows.filter((i) => i.priority === 'critical').length },
          { label: 'Resolved', value: rows.filter((i) => i.status === 'resolved').length },
        ]} />
        <DataTable<Incident>
          rows={rows}
          columns={[
            { key: 'id', header: 'Incident', mono: true },
            { key: 'priority', header: 'Priority', render: (r) => <Badge variant={PRIORITY[r.priority ?? ''] ?? 'neutral'}>{r.priority ?? '—'}</Badge> },
            { key: 'eventType', header: 'Event', render: (r) => eventLabel(r.eventType) },
            { key: 'device', header: 'Device IMEI', mono: true, render: (r) => r.device ?? '—' },
            { key: 'status', header: 'Status', render: (r) => r.status ?? '—' },
            { key: 'openedAt', header: 'Opened', render: (r) => r.openedAt ?? '—' },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">Call customer</Button> },
          ]}
        />
      </div>
    </>
  );
}
