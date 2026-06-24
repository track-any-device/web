'use client';

import React from 'react';
import Pusher from 'pusher-js';
import { Waypoints } from 'lucide-react';
import { Card } from '@/components/ui';
import { getAuthToken } from '@/lib/auth-store';

/* Live window onto a tenant's device communication — the logs surface for TAD101-channel orgs
   (REST/MQTT orgs see the outbound Forwarding activity feed instead). Themed to match that card:
   a brand-green TAD101 header, live throughput tiles, and a newest-first event table.

   Subscribes via Soketi/Pusher to two channels:
   - private-tenant.{id}.device-logs — `device-log` events (every inbound frame / outbound command);
   - private-tenant.{id}.locations   — `locations.batch` (TCP location fixes, most of the traffic)
     and `signal.created` events.
   All three event types merge into the SAME newest-first list, capped at the existing limit.
   The tiles count real events seen since this view opened; nothing is fabricated. */

interface LogEvent {
  ts?: string;
  source?: string;
  direction?: 'in' | 'out' | string;
  level?: string;
  summary?: string;
  device_id?: number;
  imei?: string | null;
  tenant_id?: number;
  payload?: Record<string, unknown>;
}
type Entry = LogEvent & { _id: number };

// TCP location/signal traffic broadcast on private-tenant.{id}.locations.
interface LocationsBatch {
  tenant_id?: number;
  count?: number;
  locations?: Array<{ lat?: number; lng?: number; battery?: number; imei?: string; recorded_at?: string }>;
}
interface SignalCreated {
  device_id?: number;
  imei?: string;
  signal?: Record<string, unknown>;
}

const ACCENT = 'var(--brand)'; // TAD101 channel theme — Pakistan green, matches forwarding-activity.

const LEVEL_COLOR: Record<string, string> = {
  info: 'var(--text-muted)', warn: 'var(--warning)', warning: 'var(--warning)',
  error: 'var(--danger)', critical: 'var(--danger)',
};

export function TenantLogs({ tenantId }: { tenantId: number | string }) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [counts, setCounts] = React.useState({ total: 0, locations: 0, frames: 0 });
  const [lastEventAt, setLastEventAt] = React.useState<number | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [, setTick] = React.useState(0); // re-renders the relative "last event" label every second
  const seq = React.useRef(0);

  React.useEffect(() => {
    const token = getAuthToken();
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    if (!token) { setError('Sign in again to view the live feed (no auth token).'); return; }
    if (!key) { setError('Realtime is not configured (NEXT_PUBLIC_PUSHER_APP_KEY is unset).'); return; }

    const pusher = new Pusher(key, {
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST,
      wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
      wssPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT ?? 443),
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'mt1',
      forceTLS: (process.env.NEXT_PUBLIC_PUSHER_SCHEME ?? 'https') === 'https',
      authEndpoint: '/api/pusher/auth',
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      auth: { headers: { Authorization: `Bearer ${token}` } },
    });

    pusher.connection.bind('connected', () => setConnected(true));
    pusher.connection.bind('disconnected', () => setConnected(false));

    // Merge a new event into the same newest-first list, capped at the existing limit.
    const push = (e: LogEvent) =>
      setEntries((prev) => [{ ...e, _id: seq.current++ }, ...prev].slice(0, 200));
    // Tally real throughput since the view opened (the list itself is capped; these are not).
    const bump = (kind: 'locations' | 'frames', n = 1) => {
      setCounts((c) => ({ ...c, total: c.total + n, [kind]: c[kind] + n }));
      setLastEventAt(Date.now());
    };

    // pusher-js passes an object ({status, error, ...}) here; pull out a readable code.
    const onSubError = (name: string) => (e: unknown) => {
      const code = typeof e === 'object' && e !== null
        ? ((e as { status?: number }).status ?? (e as { error?: { data?: { code?: number } } }).error?.data?.code ?? '')
        : e;
      setError(`Could not subscribe to ${name}${code ? ` (auth ${code})` : ''}.`);
    };

    // Existing device-logs channel — every inbound frame / outbound command.
    const logsName = `private-tenant.${tenantId}.device-logs`;
    const logsChannel = pusher.subscribe(logsName);
    logsChannel.bind('pusher:subscription_error', onSubError(logsName));
    logsChannel.bind('device-log', (data: LogEvent) => { push(data); bump('frames'); });

    // Locations channel — TCP fixes (most traffic) and per-signal events.
    const locName = `private-tenant.${tenantId}.locations`;
    const locChannel = pusher.subscribe(locName);
    locChannel.bind('pusher:subscription_error', onSubError(locName));
    locChannel.bind('locations.batch', (data: LocationsBatch) => {
      const locs = data?.locations ?? [];
      for (const l of locs) {
        const coords = l.lat != null && l.lng != null ? `${l.lat},${l.lng}` : '—';
        const bat = l.battery != null ? ` · ${l.battery}%` : '';
        push({
          ts: l.recorded_at,
          source: 'tcp',
          direction: 'in',
          summary: `location · ${l.imei ?? '—'} · ${coords}${bat}`,
          imei: l.imei ?? null,
        });
      }
      if (locs.length) bump('locations', locs.length);
    });
    locChannel.bind('signal.created', (data: SignalCreated) => {
      push({
        source: 'tcp',
        direction: 'in',
        summary: `signal · ${data?.imei ?? '—'}`,
        imei: data?.imei ?? null,
        device_id: data?.device_id,
      });
      bump('locations');
    });

    const ticker = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(ticker); pusher.unsubscribe(logsName); pusher.unsubscribe(locName); pusher.disconnect(); };
  }, [tenantId]);

  const headerPill = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: connected ? 'var(--success)' : 'var(--text-muted)', boxShadow: connected ? '0 0 0 3px color-mix(in srgb, var(--success) 25%, transparent)' : 'none' }} />
        {connected ? 'live' : 'connecting…'}
      </span>
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-pill)',
          fontSize: 12, fontWeight: 700, color: ACCENT, background: `color-mix(in srgb, ${ACCENT} 12%, transparent)`,
        }}
      >
        <Waypoints size={13} strokeWidth={2.2} aria-hidden />
        TAD101 channel
      </span>
    </div>
  );

  return (
    <Card title="Live channel feed" action={headerPill}>
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Live throughput since this view opened */}
        <div>
          <div className="tad-statrow">
            <MetricTile label="Events" value={counts.total} accent={ACCENT} />
            <MetricTile label="Locations" value={counts.locations} accent={ACCENT} />
            <MetricTile label="Frames" value={counts.frames} accent={ACCENT} />
            <MetricTile label="Last event" value={relAge(lastEventAt)} accent={ACCENT} mono />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Live since this view opened · <span style={{ fontFamily: 'var(--font-mono)' }}>tenant.{String(tenantId)}.device-logs</span> + .locations
          </div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

        {/* Live feed */}
        <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28, fontSize: 13 }}>
                {error ? 'Feed unavailable.' : 'Waiting for device communication on this tenant’s channel…'}
              </div>
            ) : (
              <table className="tad-table">
                <tbody>
                  {entries.map((e) => (
                    <tr key={e._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {fmtTime(e.ts)}
                      </td>
                      <td style={{ width: 24, textAlign: 'center', color: e.direction === 'out' ? 'var(--sky, #2b7fff)' : 'var(--success)' }} title={e.direction === 'out' ? 'server → device' : 'device → server'}>
                        {e.direction === 'out' ? '↑' : '↓'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{e.source ?? '—'}</td>
                      <td style={{ color: LEVEL_COLOR[e.level ?? 'info'] ?? 'var(--text)' }}>{e.summary ?? '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{e.imei ?? (e.device_id ? `#${e.device_id}` : '')}</td>
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

/* Themed metric tile — mirrors the forwarding-activity card's tiles so both logs surfaces match. */
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

function fmtTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleTimeString();
}

function relAge(ms: number | null): string {
  if (!ms) return 'never';
  const sec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
