import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { HeartbeatCell } from '@/components/tad/heartbeat';
import { Badge } from '@/components/ui';
import { fetchPortalOne } from '@/lib/admin-api';
import { type TenantDetail, type TenantDeviceRow } from '@/lib/portal-data';
import { TenantLogs } from './tenant-logs';

const DEVICE_STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', pending: 'warning', blocked: 'danger',
};

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: t, error } = await fetchPortalOne<TenantDetail>(`/admin/tenants/${id}`);

  if (!t) {
    return (
      <>
        <PortalTopbar title="Organisation" subtitle="Tenant detail" />
        <div className="tad-portal__body">
          <div className="tad-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
            {error ?? 'Organisation not found.'}{' '}
            <Link href="/admin/organisations" style={{ fontWeight: 600 }}>Back to organisations</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PortalTopbar title={t.name} subtitle={`Organisation · ${t.slug}`} />
      <div className="tad-portal__body" style={{ display: 'grid', gap: 16 }}>
        <StatRow stats={[
          { label: 'Devices', value: t.deviceCount },
          { label: 'Members', value: t.members },
          { label: 'Connection key', value: t.hasKey ? 'Issued' : 'Not issued' },
          { label: 'Key last used', value: t.lastUsed ?? '—' },
        ]} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 8px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800 }}>Live channel logs</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Communication on this tenant’s broadcast channel, in real time</span>
          </div>
          <TenantLogs tenantId={t.id} />
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, margin: '4px 2px 8px' }}>Devices</h2>
          <DataTable<TenantDeviceRow>
            rows={t.devices}
            empty={error ?? 'No devices assigned to this organisation yet.'}
            columns={[
              { key: 'imei', header: 'IMEI / Broadcast ID', mono: true, render: (d) => d.imei ?? d.broadcastId ?? '—' },
              { key: 'model', header: 'Model', render: (d) => d.model ?? '—' },
              { key: 'status', header: 'Status', render: (d) => <Badge variant={DEVICE_STATUS[d.status ?? ''] ?? 'neutral'}>{d.status ?? 'unknown'}</Badge> },
              { key: 'heartbeat', header: 'Heartbeat', render: (d) => <HeartbeatCell online={d.online} at={d.heartbeatAt} intervalS={d.heartbeatIntervalS} /> },
              { key: 'lastSeen', header: 'Last seen', render: (d) => d.lastSeen ?? '—' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
