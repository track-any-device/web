'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, Radio, Waypoints, KeyRound, ArrowUpRight, Pencil, Trash2, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatRow } from '@/components/tad/data-table';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { TablePager, TableSearch } from '@/components/tad/table-controls';
import { Badge, Button, IconButton, Input, Card, Switch } from '@/components/ui';
import type { PortalMeta } from '@/lib/admin-api';

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
  // true for the single public-tracker (default) tenant — its delete is disabled
  isDefault?: boolean;
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

export function OrganisationsList({ initial, meta, loadError }: { initial: TenantRow[]; meta: PortalMeta | null; loadError: string | null }) {
  const [rows, setRows] = React.useState<TenantRow[]>(initial);

  // Server pagination: a page/search navigation delivers new `initial` rows.
  React.useEffect(() => setRows(initial), [initial]);
  const [showForm, setShowForm] = React.useState(false);
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<Revealed | null>(null);
  const [editing, setEditing] = React.useState<TenantRow | null>(null);
  const [deleting, setDeleting] = React.useState<TenantRow | null>(null);

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

  /** PATCH name + default flag. Returns an error message on failure (kept inside the dialog). */
  async function save(t: TenantRow, name: string, isDefault: boolean): Promise<string | null> {
    const res = await fetch(`/api/admin/tenants/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), is_default: isDefault }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data?.message ?? 'Could not save the organisation.';
    // Update in place. When this one becomes the default, demote any other row that held it.
    setRows((r) => r.map((x) => {
      if (x.id === t.id) return { ...x, name: data.name ?? name.trim(), isDefault: data.isDefault ?? isDefault };
      return isDefault ? { ...x, isDefault: false } : x;
    }));
    setEditing(null);
    return null;
  }

  /** DELETE a tenant. Surfaces a 403 (non-admin) / 422 (default) message inside the dialog. */
  async function remove(t: TenantRow): Promise<string | null> {
    const res = await fetch(`/api/admin/tenants/${t.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 403) return data?.message ?? 'You do not have permission to delete organisations.';
      return data?.message ?? 'Could not delete the organisation.';
    }
    setRows((r) => r.filter((x) => x.id !== t.id));
    setDeleting(null);
    return null;
  }

  const tad101Count = rows.filter(isTad101).length;
  const forwardingCount = rows.length - tad101Count;

  return (
    <>
      <PortalTopbar
        title="Organisations"
        subtitle="Tenant accounts (B2B fleets), their transport and delivery"
        right={
          <Button onClick={() => { setShowForm((s) => !s); setError(null); }}>
            {showForm ? 'Close' : 'New organisation'}
          </Button>
        }
      />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Organisations', value: (meta?.total ?? rows.length).toLocaleString() },
          { label: 'On TAD101 channel', value: tad101Count, hint: 'broadcast over the channel (this page)' },
          { label: 'Forwarding out', value: forwardingCount, hint: 'REST API / MQTT (this page)' },
          { label: 'Devices managed', value: rows.reduce((n, t) => n + (t.devices || 0), 0), hint: 'this page' },
        ]} />

        <TableSearch placeholder="Search name or slug…" />

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
          {rows.map((t) => (
            <OrgCard
              key={t.id}
              t={t}
              onRotate={() => rotate(t)}
              onEdit={() => setEditing(t)}
              onDelete={() => setDeleting(t)}
            />
          ))}
        </div>
      )}

      <TablePager meta={meta} />

      {revealed && <KeyDialog data={revealed} onClose={() => setRevealed(null)} />}
      {editing && <EditDialog t={editing} onSave={save} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog t={deleting} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </div>
    </>
  );
}

/* ── One organisation card ─────────────────────────────────────────────── */

function OrgCard({ t, onRotate, onEdit, onDelete }: { t: TenantRow; onRotate: () => void; onEdit: () => void; onDelete: () => void }) {
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
            {t.isDefault && (
              <Badge variant="success" style={{ marginTop: 6 }}>
                <Star size={12} strokeWidth={2.4} aria-hidden />
                Public tracker
              </Badge>
            )}
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

        {/* Footer actions — Edit/Delete are icon-only so the row stays on one line and the footers
            align across the grid whether or not the card has a "New key" button. */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 4, alignItems: 'center' }}>
          {tad101 && (
            <Button variant="ghost" size="sm" onClick={onRotate}>{t.hasKey ? 'New key' : 'Issue key'}</Button>
          )}
          <IconButton size="sm" label="Edit organisation" onClick={onEdit}>
            <Pencil strokeWidth={2.2} aria-hidden />
          </IconButton>
          {t.isDefault ? (
            <span title="Unset the public-tracker default first to delete" style={{ display: 'inline-flex' }}>
              <IconButton size="sm" label="Delete organisation" disabled>
                <Trash2 strokeWidth={2.2} aria-hidden />
              </IconButton>
            </span>
          ) : (
            <IconButton size="sm" className="tad-iconbtn--danger" label="Delete organisation" onClick={onDelete}>
              <Trash2 strokeWidth={2.2} aria-hidden />
            </IconButton>
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

/* ── Modal shell (mirrors KeyDialog) ───────────────────────────────────── */

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
      <Card onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
        {children}
      </Card>
    </div>
  );
}

/* ── Edit organisation (name + public-tracker default toggle) ──────────── */

function EditDialog({
  t,
  onSave,
  onClose,
}: {
  t: TenantRow;
  onSave: (t: TenantRow, name: string, isDefault: boolean) => Promise<string | null>;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(t.name);
  const [isDefault, setIsDefault] = React.useState(!!t.isDefault);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSave(t, name, isDefault);
    if (err) { setError(err); setBusy(false); }
    // On success the parent closes the dialog.
  }

  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Edit organisation</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
          The slug (<span style={{ fontFamily: 'var(--font-mono)' }}>{t.slug}</span>) identifies this tenant to its server and can’t be changed.
        </p>
        <div style={{ display: 'grid', gap: 16 }}>
          <Input label="Organisation name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div style={{ display: 'grid', gap: 6 }}>
            <Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} label="Public tracker tenant (default)" />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Only one organisation can be the public tracker — turning this on moves it here from whichever org currently holds it.
            </div>
          </div>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={busy || !name.trim()}>Save changes</Button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── Delete organisation (confirm + device-unassign warning) ───────────── */

function DeleteDialog({
  t,
  onConfirm,
  onClose,
}: {
  t: TenantRow;
  onConfirm: (t: TenantRow) => Promise<string | null>;
  onClose: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const count = t.devices || 0;

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await onConfirm(t);
    if (err) { setError(err); setBusy(false); }
    // On success the parent removes the row + closes the dialog.
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Delete {t.name}?</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.6 }}>
        This permanently removes the organisation and its connection key. This can’t be undone.
      </p>
      <div style={{ fontSize: 13, lineHeight: 1.6, background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)', borderRadius: 10, padding: '10px 12px' }}>
        {count > 0 ? (
          <><strong>{count}</strong> {count === 1 ? 'device' : 'devices'} assigned to this organisation will be <strong>unassigned</strong> (not deleted) and fall back to unassigned.</>
        ) : (
          <>No devices are assigned to this organisation.</>
        )}
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="danger" loading={busy} disabled={busy} onClick={confirm}>Delete organisation</Button>
      </div>
    </ModalShell>
  );
}
