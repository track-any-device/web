'use client';

import React from 'react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { HeartbeatCell } from '@/components/tad/heartbeat';
import { Badge, Tabs } from '@/components/ui';
import { type TenantDetail, type TenantDeviceRow } from '@/lib/portal-data';
import { TenantLogs } from './tenant-logs';
import { ForwardingConfig } from './forwarding-config';
import { ForwardingActivity } from './forwarding-activity';

const DEVICE_STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success', pending: 'warning', blocked: 'danger',
};

type Tab = 'devices' | 'settings' | 'logs';

export function OrgDetailTabs({
  tenant,
  transport,
  loadError,
}: {
  tenant: TenantDetail;
  transport: string;
  loadError?: string | null;
}) {
  const [tab, setTab] = React.useState<Tab>('devices');

  // One logs surface per transport: REST/MQTT orgs forward outbound → show the Forwarding activity
  // feed; the Live channel feed is shown ONLY for TAD101-channel orgs (and the safe default), whose
  // device traffic rides the broadcast channel rather than leaving over an external transport.
  const showForwardingActivity = transport === 'rest_api' || transport === 'mqtt';

  return (
    <div className="tad-portal__body" style={{ display: 'grid', gap: 16 }}>
      <Tabs
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        items={[
          { value: 'devices', label: 'Devices', count: tenant.deviceCount ?? 0 },
          { value: 'settings', label: 'Settings' },
          { value: 'logs', label: 'Logs' },
        ]}
      />

      {tab === 'devices' && (
        <>
          <StatRow stats={[
            { label: 'Devices', value: tenant.deviceCount ?? 0 },
            { label: 'Members', value: tenant.members ?? 0 },
            { label: 'Connection key', value: tenant.hasKey ? 'Issued' : 'Not issued' },
            { label: 'Key last used', value: tenant.lastUsed ?? '—' },
          ]} />

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, margin: '4px 2px 8px' }}>Devices</h2>
            <DataTable<TenantDeviceRow>
              rows={tenant.devices ?? []}
              empty={loadError ?? 'No devices assigned to this organisation yet.'}
              columns={[
                { key: 'imei', header: 'IMEI / Broadcast ID', mono: true, render: (d) => d.imei ?? d.broadcastId ?? '—' },
                { key: 'model', header: 'Model', render: (d) => d.model ?? '—' },
                { key: 'status', header: 'Status', render: (d) => <Badge variant={DEVICE_STATUS[d.status ?? ''] ?? 'neutral'}>{d.status ?? 'unknown'}</Badge> },
                { key: 'heartbeat', header: 'Heartbeat', render: (d) => <HeartbeatCell online={d.online} at={d.heartbeatAt} intervalS={d.heartbeatIntervalS} /> },
                { key: 'lastSeen', header: 'Last seen', render: (d) => d.lastSeen ?? '—' },
              ]}
            />
          </div>
        </>
      )}

      {tab === 'settings' && (
        <ForwardingConfig tenantId={tenant.id} />
      )}

      {tab === 'logs' && (
        showForwardingActivity
          ? <ForwardingActivity tenantId={tenant.id} />
          : <TenantLogs tenantId={tenant.id} />
      )}
    </div>
  );
}
