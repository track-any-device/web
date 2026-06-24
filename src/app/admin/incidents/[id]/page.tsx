import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { Badge, Button, Card } from '@/components/ui';
import { fetchPortalOne } from '@/lib/admin-api';
import { eventLabel } from '@/lib/portal-data';
import type { AdminIncidentDetail } from '../incidents-types';
import { PlaybackCard } from './playback-client';

const PRIORITY: Record<string, 'danger' | 'warning' | 'neutral'> = { critical: 'danger', high: 'warning', medium: 'neutral', low: 'neutral', info: 'neutral' };
const STATUS: Record<string, 'danger' | 'warning' | 'success' | 'neutral'> = { open: 'danger', acknowledged: 'warning', escalated: 'danger', resolved: 'success', dismissed: 'neutral' };

function fmt(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value ?? '—'}</span>
    </div>
  );
}

export default async function AdminIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: inc, error } = await fetchPortalOne<AdminIncidentDetail>(`/admin/incidents/${id}`);

  if (!inc) {
    return (
      <>
        <PortalTopbar title="Incident" subtitle="Incident detail" />
        <div className="tad-portal__body">
          <Card>
            <p style={{ color: 'var(--text-muted)' }}>{error ?? 'Incident not found.'}</p>
            <div style={{ marginTop: 12 }}><Link href="/admin/incidents"><Button variant="ghost" size="sm">Back to incidents</Button></Link></div>
          </Card>
        </div>
      </>
    );
  }

  const title = inc.label ?? eventLabel(inc.eventType);
  const coords = inc.lat != null && inc.lon != null ? `${inc.lat.toFixed(6)}, ${inc.lon.toFixed(6)}` : null;

  return (
    <>
      <PortalTopbar
        title={title}
        subtitle={`Incident #${inc.id}`}
        right={<Link href="/admin/incidents"><Button variant="ghost" size="sm">Back</Button></Link>}
      />
      <div className="tad-portal__body">
       {/* Meta grid: 1 col on phones → 3 on lg. The playback card spans the full width below it. */}
       <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Incident">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Event" value={title} />
            <Field label="Type" value={inc.eventType ? <span style={{ fontFamily: 'var(--font-mono)' }}>{inc.eventType}</span> : '—'} />
            <Field label="Priority" value={<Badge variant={PRIORITY[inc.priority ?? ''] ?? 'neutral'}>{inc.priority ?? '—'}</Badge>} />
            <Field label="Status" value={<Badge variant={STATUS[inc.status ?? ''] ?? 'neutral'}>{inc.status ?? '—'}</Badge>} />
            {inc.level && <Field label="Level" value={inc.level} />}
          </div>
        </Card>

        <Card title="Lifecycle">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Triggered" value={fmt(inc.triggeredAt)} mono />
            <Field label="Acknowledged" value={fmt(inc.acknowledgedAt)} mono />
            <Field label="Resolved" value={fmt(inc.resolvedAt)} mono />
          </div>
        </Card>

        <Card title="Device">
          <div style={{ display: 'grid', gap: 12 }}>
            <Field
              label="Device"
              value={inc.device
                ? <Link href={`/admin/devices/${inc.device.id}`}>{inc.device.name ?? inc.device.imei ?? `Device ${inc.device.id}`}</Link>
                : <span style={{ color: 'var(--text-muted)' }}>—</span>}
            />
            <Field label="IMEI" value={inc.device?.imei ?? null} mono />
            <Field
              label="Incident location"
              mono
              value={coords ? <a href={`https://maps.google.com/?q=${inc.lat},${inc.lon}`} target="_blank" rel="noopener noreferrer">{coords}</a> : null}
            />
          </div>
        </Card>

        {/* Archived-track playback (full width below the meta row) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <PlaybackCard locations={inc.locations ?? []} />
        </div>
       </div>
      </div>
    </>
  );
}
