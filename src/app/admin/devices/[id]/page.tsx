import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { Badge, Button, Card } from '@/components/ui';
import { fetchPortal, fetchPortalOne } from '@/lib/admin-api';
import { type AdminDeviceDetail } from '@/lib/portal-data';
import { DeviceMapCard } from './device-map-card';
import { DeviceActivityCard } from './device-activity-card';
import { OwnershipCard, type UserOption, type TenantOption } from './ownership-card';

const STATUS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = { active: 'success', pending: 'warning', blocked: 'danger' };

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value ?? '—'}</span>
    </div>
  );
}

export default async function AdminDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: d, error } = await fetchPortalOne<AdminDeviceDetail>(`/admin/devices/${id}`);

  // Lightweight picker data for the editable Ownership card — reuse the existing admin list endpoints.
  const [{ data: users }, { data: tenants }] = await Promise.all([
    fetchPortal<UserOption>('/admin/users?per_page=100'),
    fetchPortal<TenantOption>('/admin/tenants?per_page=100'),
  ]);

  if (!d) {
    return (
      <>
        <PortalTopbar title="Device" subtitle="Device detail" />
        <div className="tad-portal__body">
          <Card>
            <p style={{ color: 'var(--text-muted)' }}>{error ?? 'Device not found.'}</p>
            <div style={{ marginTop: 12 }}><Link href="/admin/devices"><Button variant="ghost" size="sm">Back to devices</Button></Link></div>
          </Card>
        </div>
      </>
    );
  }

  const coords = d.lastLat != null && d.lastLon != null ? `${d.lastLat.toFixed(6)}, ${d.lastLon.toFixed(6)}` : null;

  return (
    <>
      <PortalTopbar
        title={d.name ?? d.imei ?? `Device ${d.id}`}
        subtitle={d.model ?? 'Device detail'}
        right={<Link href="/admin/devices"><Button variant="ghost" size="sm">Back</Button></Link>}
      />
      <div className="tad-portal__body">
       {/* Detail grid: 1 col on phones → 2 on small → 4 on xl. Full-width cards (activity / incidents)
           keep col-span-full so they always stretch the row regardless of column count. */}
       <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Identity">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Status" value={<Badge variant={STATUS[d.status ?? ''] ?? 'neutral'}>{d.status ?? '—'}</Badge>} />
            <Field label="IMEI" value={d.imei} mono />
            <Field label="Broadcast ID" value={d.broadcastId} mono />
            <Field label="SIM number" value={d.sim} mono />
            <Field label="GSM / PTA IMEI" value={d.gsm} mono />
            <Field label="Model" value={d.model} />
          </div>
        </Card>

        <OwnershipCard device={d} users={users} tenants={tenants} />

        <Card title="Live status">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Heartbeat" value={<Badge variant={d.online ? 'success' : 'neutral'}>{d.online ? 'Online' : 'Offline'}</Badge>} />
            <Field label="Last heartbeat" value={d.heartbeatAt} />
            <Field label="Last seen" value={d.lastSeen} />
            <Field label="Battery" value={d.battery != null ? `${d.battery}%` : null} />
            <Field
              label="Last position"
              mono
              value={coords ? <a href={`https://maps.google.com/?q=${d.lastLat},${d.lastLon}`} target="_blank" rel="noopener noreferrer">{coords}</a> : null}
            />
          </div>
        </Card>

        <DeviceMapCard lat={d.lastLat ?? null} lon={d.lastLon ?? null} online={d.online} name={d.name} />

        {/* Activity / battery / reporting telemetry over time (full-width, below the 4-column row). */}
        <DeviceActivityCard deviceId={d.id} />

        <Card title="Recent alerts" style={{ gridColumn: '1 / -1' }}>
          {d.incidents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No alerts recorded for this device.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {d.incidents.map((i) => (
                <Link key={i.id} href={`/admin/incidents?device=${d.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{i.label ?? i.eventType ?? 'Event'}</span>
                  <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    {i.priority && <Badge variant={i.priority === 'critical' ? 'danger' : 'neutral'}>{i.priority}</Badge>}
                    {i.status && <Badge variant={i.status === 'open' ? 'warning' : 'success'}>{i.status}</Badge>}
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>{i.triggeredAt ? new Date(i.triggeredAt).toLocaleString() : ''}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
       </div>
      </div>
    </>
  );
}
