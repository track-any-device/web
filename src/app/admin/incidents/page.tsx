import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { INCIDENTS, eventLabel, type Incident } from '@/lib/portal-data';

const PRIORITY: Record<string, 'danger' | 'warning' | 'neutral'> = { critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral', info: 'neutral' };
const STATUS: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = { open: 'danger', acknowledged: 'warning', escalated: 'danger', resolved: 'success', dismissed: 'neutral' };

export default async function AdminIncidentsPage() {
  const rows = await fetchPortal<Incident[]>('/admin/incidents', INCIDENTS);
  return (
    <>
      <PortalTopbar title="Incidents" subtitle="Alerts raised across all devices" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Open', value: rows.filter((i) => i.status === 'open').length },
          { label: 'Acknowledged', value: rows.filter((i) => i.status === 'acknowledged').length },
          { label: 'Resolved', value: rows.filter((i) => i.status === 'resolved').length },
        ]} />
        <DataTable<Incident>
          rows={rows}
          columns={[
            { key: 'id', header: 'Incident', mono: true },
            { key: 'priority', header: 'Priority', render: (r) => <Badge variant={PRIORITY[r.priority ?? ''] ?? 'neutral'}>{r.priority ?? '—'}</Badge> },
            { key: 'eventType', header: 'Event', render: (r) => eventLabel(r.eventType) },
            { key: 'device', header: 'Device IMEI', mono: true, render: (r) => r.device ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status ?? ''] ?? 'neutral'}>{r.status ?? '—'}</Badge> },
            { key: 'openedAt', header: 'Opened', render: (r) => r.openedAt ?? '—' },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">View</Button> },
          ]}
        />
      </div>
    </>
  );
}
