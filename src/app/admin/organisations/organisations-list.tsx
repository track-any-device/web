'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Radio, Waypoints, KeyRound, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatRow } from '@/components/tad/data-table';
import { Badge, Button, Input, Card } from '@/components/ui';

/* Admin organisations listing (Wave E).
   Each org is a card showing a per-transport protocol badge plus, depending on transport:
     • rest_api / mqtt  → outbound delivery stats (last 24h) + a 7-day activity sparkline.
                          The connection key is NOT shown — it's only meaningful for TAD101 tenants.
     • tad101_channel   → connection-key info (hasKey / lastUsed) + device/member counts. No outbound
                          delivery stats (they broadcast on the channel); sparkline only if non-empty.
   Real data only — TAD101 orgs naturally have empty delivery/activity, rendered as "—"/no-graph.

   Types are local (file-scope rule): TenantRow is a superset of portal-data's Tenant; the frozen
   backend fields are optional so the UI degrades gracefully before the API ships them. */

type Transport = 'tad101_channel' | 'rest_api' | 'mqtt';

interface ActivityPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface DeliveryStats {
  windowHours: number; // 24
  delivered: number;
  failed: number;
  successRate: number | null;
}

export interface TenantRow {
  id: number | string;
  name: string;
  slug: string;
  devices: number;
  members: number;
  hasKey?: boolean;
  lastUsed?: string | null;
  createdAt?: string | null;
  // ── Frozen contract additions (optional → graceful degrade) ──
  transport?: Transport;
  forwardingEnabled?: boolean;
  delivery?: DeliveryStats;
  activity7d?: ActivityPoint[];
  // present only on a create / rotate-key response — the plain key, shown once
  key?: string;
  tenantId?: number | string;
}

interface Theme {
  label: string;
  accent: string;
  Icon: LucideIcon;
}

/* Established transport theme — mirrors [id]/forwarding-activity.tsx. */
const THEME: Record<Transport, Theme> = {
  rest_api: { label: 'REST API', accent: '#2563EB', Icon: Globe },
  mqtt: { label: 'MQTT', accent: '#7C3AED', Icon: Radio },
  tad101_channel: { label: 'TAD101 channel', accent: 'var(--brand)', Icon: Waypoints },
};

/** Missing transport → treat as the TAD101 channel default (matches the detail page fallback). */
function transportOf(t: TenantRow): Transport {
  return t.transport ?? 'tad101_channel';
}
const isTad101 = (t: TenantRow) => transportOf(t) === 'tad101_channel';

type Revealed = { id: number | string; name: string; key: string };

export function OrganisationsList({ initial, loadError }: { initial: TenantRow[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<TenantRow[]>(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<Revealed | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Could not create the organisation.');
        return;
      }
      // New tenants default to the TAD101 channel and start with a freshly issued key.
      setRows((r) => [{ ...data, hasKey: true, transport: 'tad101_channel' } as TenantRow, ...r]);
      setRevealed({ id: data.tenantId ?? data.id, name: data.name, key: data.key });
      setName('');
      setShowForm(false);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function rotate(t: TenantRow) {
    if (!window.confirm(`Issue a new connection key for ${t.name}? Its current key will stop working immediately.`)) return;
    const res = await fetch(`/api/admin/tenants/${t.id}/key`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRevealed({ id: t.id, name: t.name, key: data.key });
      setRows((r) => r.map((x) => (x.id === t.id ? { ...x, hasKey: true } : x)));
    }
  }

  const tad101Count = rows.filter(isTad101).length;
  const forwardingCount = rows.length - tad101Count;

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <StatRow stats={[
          { label: 'Organisations', value: rows.length },
          { label: 'On TAD101 channel', value: tad101Count, hint: 'broadcast over the channel' },
          { label: 'Forwarding out', value: forwardingCount, hint: 'REST API / MQTT' },
          { label: 'Devices managed', value: rows.reduce((n, t) => n + (t.devices || 0), 0) },
        ]} />
        <Button onClick={() => { setShowForm((s) => !s); setError(null); }}>
          {showForm ? 'Close' : 'New organisation'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={create} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Input label="Organisation name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Logistics" autoFocus />
            </div>
            <Button type="submit" loading={busy} disabled={busy}>Create &amp; issue key</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
          </form>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </Card>
      )}

      {rows.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 20px', fontSize: 14, lineHeight: 1.6 }}>
            {loadError ?? 'No organisations yet — create the first one to issue a connection key and start tracking fleets.'}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {rows.map((t) => <OrgCard key={t.id} t={t} onRotate={() => rotate(t)} />)}
        </div>
      )}

      {revealed && <KeyDialog data={revealed} onClose={() => setRevealed(null)} />}
    </div>
  );
}

/* ── One organisation card ─────────────────────────────────────────────── */

function OrgCard({ t, onRotate }: { t: TenantRow; onRotate: () => void }) {
  const transport = transportOf(t);
  const theme = THEME[transport];
  const tad101 = transport === 'tad101_channel';
  const activity = t.activity7d ?? [];
  const hasActivity = activity.some((p) => (p.count || 0) > 0);

  return (
    <Card interactive style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: '100%' }}>
        {/* Header: name + slug, protocol badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/admin/organisations/${t.id}`}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              {t.name}
              <ArrowUpRight size={15} strokeWidth={2.4} aria-hidden style={{ color: 'var(--text-muted)' }} />
            </Link>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.slug}
            </div>
          </div>
          <ProtocolBadge theme={theme} />
        </div>

        {/* Counts (always shown) */}
        <div style={{ display: 'flex', gap: 18 }}>
          <CountStat label="Devices" value={t.devices} />
          <CountStat label="Members" value={t.members} />
        </div>

        {tad101 ? (
          /* TAD101: connection-key info, no outbound delivery stats. */
          <div style={{ display: 'grid', gap: 6 }}>
            <FieldLabel>Connection key</FieldLabel>
            {t.hasKey ? (
              <Badge variant="success" style={{ alignSelf: 'flex-start' }}>
                <KeyRound size={12} strokeWidth={2.4} aria-hidden />
                Active{t.lastUsed ? ` · used ${t.lastUsed}` : ''}
              </Badge>
            ) : (
              <Badge variant="neutral" style={{ alignSelf: 'flex-start' }}>Not issued</Badge>
            )}
          </div>
        ) : (
          /* REST API / MQTT: outbound delivery stats. No key shown. */
          <DeliveryBlock accent={theme.accent} delivery={t.delivery} enabled={t.forwardingEnabled} />
        )}

        {/* Activity sparkline. Forwarding orgs always get the block (shows "—" when empty);
            TAD101 only when it actually has data, since it has no outbound feed. */}
        {(!tad101 || hasActivity) && (
          <ActivitySparkline data={activity} accent={theme.accent} hasActivity={hasActivity} />
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          {tad101 && (
            <Button variant="ghost" size="sm" onClick={onRotate}>{t.hasKey ? 'New key' : 'Issue key'}</Button>
          )}
          <Link href={`/admin/organisations/${t.id}`} style={{ marginLeft: 'auto' }}>
            <Button variant="ghost" size="sm">Manage</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function ProtocolBadge({ theme }: { theme: Theme }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-pill)',
        fontSize: 12, fontWeight: 700, color: theme.accent, flex: 'none', whiteSpace: 'nowrap',
        background: `color-mix(in srgb, ${theme.accent} 12%, transparent)`,
      }}
    >
      <theme.Icon size={13} strokeWidth={2.2} aria-hidden />
      {theme.label}
    </span>
  );
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="tad-metric__label">{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: 'var(--text)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="tad-metric__label">{children}</div>;
}

/* Delivery stats for forwarding (rest_api / mqtt) orgs — delivered / failed / success-rate, last 24h.
   No data yet (endpoint not deployed, or no traffic) → friendly "—" line, never fabricated numbers. */
function DeliveryBlock({ accent, delivery, enabled }: { accent: string; delivery?: DeliveryStats; enabled?: boolean }) {
  const windowH = delivery?.windowHours ?? 24;
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FieldLabel>Delivery · last {windowH}h</FieldLabel>
        {enabled === false && <Badge variant="neutral">Paused</Badge>}
      </div>
      {delivery ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <DeliveryStat label="Delivered" value={delivery.delivered} color="var(--success)" />
          <DeliveryStat label="Failed" value={delivery.failed} color={delivery.failed > 0 ? 'var(--danger)' : 'var(--text)'} />
          <DeliveryStat
            label="Success"
            value={delivery.successRate != null ? `${delivery.successRate}%` : '—'}
            color={accent}
          />
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No deliveries in the last {windowH}h — <span style={{ fontFamily: 'var(--font-mono)' }}>—</span></div>
      )}
    </div>
  );
}

function DeliveryStat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

/* Compact inline SVG sparkline over activity7d.count — small enough to sit inside a card row
   (TrendArea is full-height). Empty / all-zero series renders a flat baseline + "—", never faked. */
function ActivitySparkline({ data, accent, hasActivity }: { data: ActivityPoint[]; accent: string; hasActivity: boolean }) {
  const W = 300;
  const H = 40;
  const total = data.reduce((n, p) => n + (p.count || 0), 0);

  let path = '';
  let area = '';
  if (data.length > 1 && hasActivity) {
    const max = Math.max(...data.map((p) => p.count || 0), 1);
    const stepX = W / (data.length - 1);
    const y = (c: number) => H - 3 - (Math.max(0, c) / max) * (H - 6);
    const pts = data.map((p, i) => [i * stepX, y(p.count || 0)] as const);
    path = pts.map(([x, yy], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${yy.toFixed(1)}`).join(' ');
    area = `${path} L${W},${H} L0,${H} Z`;
  }
  const gid = React.useId().replace(/:/g, '');

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <FieldLabel>Activity · 7d</FieldLabel>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: hasActivity ? 'var(--text)' : 'var(--text-muted)' }}>
          {hasActivity ? total : '—'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label={`7-day activity: ${hasActivity ? total : 'none'}`}>
        {hasActivity && path ? (
          <>
            <defs>
              <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.26} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#spark-${gid})`} stroke="none" />
            <path d={path} fill="none" stroke={accent} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <line x1="0" y1={H - 3} x2={W} y2={H - 3} stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    </div>
  );
}

/* ── Key reveal dialog (unchanged behaviour, TAD101 tenants only) ──────── */

function KeyDialog({ data, onClose }: { data: Revealed; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.key); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
      <Card onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Connection key — {data.name}</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Copy this now — it is shown only once. Paste it into a server-tenant instance to connect and listen on the tenant channel.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <KeyField label="Tenant ID — send as X-Tenant-Id" value={String(data.id)} />
          <KeyField label="Access key — send as Authorization: Bearer …" value={data.key} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy key'}</Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
}

function KeyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--surface-sunken, #f3efe7)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
