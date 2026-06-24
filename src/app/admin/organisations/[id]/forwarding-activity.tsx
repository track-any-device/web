'use client';

import React from 'react';
import { Globe, Radio, Waypoints, Check, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

/* Outbound forwarding activity for one tenant. Reads the BFF logs endpoint on mount and every 10s,
   and shows the delivery stats + a newest-first activity log, themed per transport (REST API / MQTT /
   TAD101 channel). The TAD101 channel doesn't forward outbound, so for it we just point back at the
   live channel feed above. Real data only — nothing is fabricated. */

type Transport = 'tad101_channel' | 'rest_api' | 'mqtt';
type EventKind = 'location' | 'heartbeat';

interface LogRow {
  id: number | string;
  transport: Transport;
  event: EventKind;
  ok: boolean;
  status: number | null;
  latencyMs: number | null;
  error: string | null;
  at: string;
}
interface Stats {
  windowHours: number;
  sent: number;
  delivered: number;
  failed: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  lastDeliveryAt: string | null;
  lastError: string | null;
  byEvent: { location: number; heartbeat: number };
}
interface ForwardingLogs {
  transport: Transport;
  enabled: boolean;
  logs: LogRow[];
  stats: Stats;
}

interface Theme { label: string; accent: string; Icon: LucideIcon }
const THEME: Record<Transport, Theme> = {
  rest_api: { label: 'REST API', accent: '#2563EB', Icon: Globe },
  mqtt: { label: 'MQTT', accent: '#7C3AED', Icon: Radio },
  tad101_channel: { label: 'TAD101 channel', accent: 'var(--brand)', Icon: Waypoints },
};

const REFRESH_MS = 10_000;

export function ForwardingActivity({ tenantId }: { tenantId: number | string }) {
  const [data, setData] = React.useState<ForwardingLogs | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [fetchedAt, setFetchedAt] = React.useState<number | null>(null);
  const [tick, setTick] = React.useState(0); // re-render the "updated Ns ago" line

  const load = React.useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/forwarding/logs`, { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setLoadError(body?.message ?? 'Could not load forwarding activity.'); return; }
      setData(body as ForwardingLogs);
      setLoadError(null);
      setFetchedAt(Date.now());
    } catch {
      setLoadError('Network error — could not load forwarding activity.');
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true); setLoadError(null);
    void load();
    const poll = setInterval(() => { if (alive) void load(); }, REFRESH_MS);
    const ticker = setInterval(() => { if (alive) setTick((t) => t + 1); }, 1000);
    return () => { alive = false; clearInterval(poll); clearInterval(ticker); };
  }, [load]);

  void tick; // depended on for the relative "updated" line below

  const transport = data?.transport ?? 'tad101_channel';
  const theme = THEME[transport];
  const headerPill = (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-pill)',
        fontSize: 12, fontWeight: 700, color: theme.accent,
        background: `color-mix(in srgb, ${theme.accent} 12%, transparent)`,
      }}
    >
      <theme.Icon size={13} strokeWidth={2.2} aria-hidden />
      {theme.label}
    </span>
  );

  const updatedLabel = fetchedAt
    ? (Date.now() - fetchedAt < REFRESH_MS + 1500 ? `updated ${Math.max(0, Math.round((Date.now() - fetchedAt) / 1000))}s ago · live` : `updated ${relTime(new Date(fetchedAt).toISOString())}`)
    : '';

  const action = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {fetchedAt && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{updatedLabel}</span>}
      <button
        type="button"
        onClick={() => load(true)}
        disabled={refreshing}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-pill)', padding: '4px 12px', fontSize: 12, fontWeight: 600,
          color: 'var(--text)', cursor: refreshing ? 'default' : 'pointer',
        }}
      >
        <RefreshCw size={13} strokeWidth={2.2} style={refreshing ? { animation: 'tad-btn-spin 0.8s linear infinite' } : undefined} aria-hidden />
        Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <Card title="Forwarding activity">
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      </Card>
    );
  }
  if (loadError || !data) {
    return (
      <Card title="Forwarding activity" action={action}>
        <div style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError ?? 'Forwarding activity unavailable.'}</div>
      </Card>
    );
  }

  if (transport === 'tad101_channel') {
    return (
      <Card title="Forwarding activity" action={headerPill}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ alignSelf: 'flex-start' }}>{action}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55, padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2, var(--bg-subtle))' }}>
            This organisation streams over the TAD101 channel — device traffic shows in the live channel feed above; there&rsquo;s no external delivery log.
          </div>
        </div>
      </Card>
    );
  }

  const { stats, logs } = data;

  return (
    <Card title="Forwarding activity" action={headerPill}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{action}</div>

        {/* Stats */}
        <div>
          <div className="tad-statrow">
            <MetricTile label="Sent" value={stats.sent} accent={theme.accent} />
            <MetricTile label="Delivered" value={stats.delivered} accent={theme.accent} />
            <MetricTile label="Failed" value={stats.failed} accent={stats.failed > 0 ? 'var(--danger)' : theme.accent} />
            <MetricTile label="Success rate" value={stats.successRate != null ? `${stats.successRate}%` : '—'} accent={theme.accent} />
            <MetricTile label="Avg latency" value={stats.avgLatencyMs != null ? `${stats.avgLatencyMs}ms` : '—'} accent={theme.accent} mono />
            <MetricTile label="Last delivery" value={relTime(stats.lastDeliveryAt)} accent={theme.accent} mono />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            location {stats.byEvent?.location ?? 0} · heartbeat {stats.byEvent?.heartbeat ?? 0} · last {stats.windowHours}h
          </div>
          {stats.lastError && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>Last error: {stats.lastError}</div>
          )}
        </div>

        {/* Activity log */}
        <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28, fontSize: 13 }}>
                No forwarding activity yet — deliveries appear here as signals arrive.
              </div>
            ) : (
              <table className="tad-table">
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {relTime(l.at)}
                      </td>
                      <td style={{ width: 92 }}>
                        {l.event === 'heartbeat'
                          ? <Badge variant="neutral">heartbeat</Badge>
                          : <Badge variant="outline" style={{ color: theme.accent, borderColor: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>location</Badge>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {l.ok ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--success)', fontWeight: 600, fontSize: 13 }}>
                            <Check size={14} strokeWidth={2.6} aria-hidden />
                            {l.status != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{l.status}</span>}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                            {l.status ?? 'failed'}
                          </span>
                        )}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {l.latencyMs != null ? `${l.latencyMs}ms` : ''}
                      </td>
                      <td style={{ color: 'var(--danger)', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={!l.ok && l.error ? l.error : undefined}>
                        {!l.ok && l.error ? l.error : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* Themed metric tile — mirrors StatRow's Card+Metric layout but lets us tint the value per transport. */
function MetricTile({ label, value, accent, mono = false }: { label: string; value: React.ReactNode; accent: string; mono?: boolean }) {
  return (
    <Card style={{ padding: 'var(--space-5)' }}>
      <span className="tad-metric__label">{label}</span>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: 800, color: accent, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)' }}>
        {value}
      </div>
    </Card>
  );
}

function relTime(ts?: string | null): string {
  if (!ts) return 'never';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
