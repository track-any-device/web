'use client';

import React from 'react';
import Pusher from 'pusher-js';
import { getAuthToken } from '@/lib/auth-store';

/* Live window onto a tenant's device-communication channel (private-tenant.{id}.device-logs).
   Subscribes via Soketi/Pusher and appends each `device-log` event — every inbound frame and
   outbound command logged for the tenant's devices. Real events only; nothing is fabricated. */

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

const LEVEL_COLOR: Record<string, string> = {
  info: 'var(--text-muted)', warn: 'var(--warning)', warning: 'var(--warning)',
  error: 'var(--danger)', critical: 'var(--danger)',
};

export function TenantLogs({ tenantId }: { tenantId: number | string }) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

    const channelName = `private-tenant.${tenantId}.device-logs`;
    const channel = pusher.subscribe(channelName);
    channel.bind('pusher:subscription_error', (status: number) =>
      setError(`Could not subscribe to ${channelName} (auth ${status}).`));
    channel.bind('device-log', (data: LogEvent) =>
      setEntries((prev) => [{ ...data, _id: seq.current++ }, ...prev].slice(0, 200)));

    return () => { pusher.unsubscribe(channelName); pusher.disconnect(); };
  }, [tenantId]);

  return (
    <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700 }}>Live channel feed</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: connected ? 'var(--success)' : 'var(--text-muted)', boxShadow: connected ? '0 0 0 3px color-mix(in srgb, var(--success) 25%, transparent)' : 'none' }} />
          <span style={{ fontFamily: 'var(--font-mono)' }}>tenant.{String(tenantId)}.device-logs</span>
          <span>· {connected ? 'live' : 'connecting…'}</span>
        </div>
      </div>

      {error && <div style={{ padding: '10px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}

      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
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
  );
}

function fmtTime(ts?: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleTimeString();
}
