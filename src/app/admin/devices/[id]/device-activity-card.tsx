'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { Card } from '@/components/ui';

/* Admin device activity graphs — speed, battery, and reporting cadence over a window.

   Data comes from the device telemetry trail (InfluxDB-backed) via the BFF at
   /api/admin/devices/[id]/trail?hours=N. Real data only: if the trail is empty (InfluxDB disabled,
   not deployed, or the device has no fixes) we show ONE friendly empty state — never empty charts or
   fabricated numbers.

   "Reporting activity" is a points-per-hour histogram. There is no heartbeat-history table, so this is
   the honest stand-in for "how often is this device reporting" — each bar is the real count of trail
   points the device produced in that hour. We do NOT fabricate a heartbeat series. */

const BRAND = 'var(--brand)';      // Pakistan green — speed series
const SUCCESS = '#1F9462';         // var(--success) — battery series

type TrailPoint = { lat: number | null; lng: number | null; t: string | null; speed: number | null; battery: number | null };
type TrailResponse = { deviceId?: number | string; hours?: number; points?: TrailPoint[]; count?: number };

type Window = 24 | 168; // 24h or 7d

// ── Inline SVG sparkline (mirrors the /my device-detail SparkLine) ──────────────
function SparkLine({ values, color, unit, label, format }: {
  values: Array<number | null>;
  color: string;
  unit: string;
  label: string;
  format?: (n: number) => string;
}) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  const W = 240, H = 56, pad = 4;
  const fmt = format ?? ((n: number) => `${Math.round(n)}`);

  let chart: React.ReactNode;
  if (pts.length < 2) {
    chart = <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Not enough data yet.</p>;
  } else {
    const xs = values.length - 1;
    const min = Math.min(...pts.map(p => p.v));
    const max = Math.max(...pts.map(p => p.v));
    const range = max - min || 1;
    const x = (i: number) => pad + (i / xs) * (W - 2 * pad);
    const y = (v: number) => pad + (1 - (v - min) / range) * (H - 2 * pad);
    const line = pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(pts[pts.length - 1].i).toFixed(1)},${H - pad} L${x(pts[0].i).toFixed(1)},${H - pad} Z`;
    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        <path d={area} fill={color} opacity="0.10" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
        {pts.length >= 1 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{fmt(pts[pts.length - 1].v)}{unit}</span>}
      </div>
      {chart}
    </div>
  );
}

// ── Reporting cadence — real points-per-hour bars (honest heartbeat stand-in) ───
function ReportingBars({ buckets, label }: { buckets: number[]; label: string }) {
  const W = 240, H = 56, pad = 4;
  const max = Math.max(...buckets, 0);
  const total = buckets.reduce((s, n) => s + n, 0);

  let chart: React.ReactNode;
  if (buckets.length === 0 || max === 0) {
    chart = <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>Not enough data yet.</p>;
  } else {
    const n = buckets.length;
    const gap = n > 60 ? 0 : 1;
    const bw = (W - 2 * pad - gap * (n - 1)) / n;
    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
        {buckets.map((c, i) => {
          const h = c === 0 ? 0 : Math.max(2, (c / max) * (H - 2 * pad));
          const x = pad + i * (bw + gap);
          return <rect key={i} x={x.toFixed(2)} y={(H - pad - h).toFixed(2)} width={Math.max(bw, 0.5).toFixed(2)} height={h.toFixed(2)} rx={bw > 3 ? 1 : 0} fill={BRAND} opacity={c === 0 ? 0.12 : 0.55} />;
        })}
      </svg>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{total} pts</span>
      </div>
      {chart}
    </div>
  );
}

// Bucket trail points into per-hour counts across the whole window (so quiet hours read as gaps).
function hourlyBuckets(points: TrailPoint[], hours: number): number[] {
  const now = Date.now();
  const start = now - hours * 3_600_000;
  const buckets = new Array(hours).fill(0);
  for (const p of points) {
    if (!p.t) continue;
    const ms = new Date(p.t).getTime();
    if (Number.isNaN(ms) || ms < start || ms > now) continue;
    const idx = Math.min(hours - 1, Math.floor((ms - start) / 3_600_000));
    buckets[idx] += 1;
  }
  return buckets;
}

export function DeviceActivityCard({ deviceId }: { deviceId: number | string }) {
  const [hours, setHours] = React.useState<Window>(24);
  const [points, setPoints] = React.useState<TrailPoint[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`/api/admin/devices/${deviceId}/trail?hours=${hours}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return (await res.json()) as TrailResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setPoints(Array.isArray(data.points) ? data.points : []);
      })
      .catch(() => { if (!cancelled) { setPoints([]); setError(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [deviceId, hours]);

  const ordered = React.useMemo(
    () => [...(points ?? [])].sort((a, b) => (a.t ? new Date(a.t).getTime() : 0) - (b.t ? new Date(b.t).getTime() : 0)),
    [points],
  );
  const speeds = ordered.map(p => p.speed);
  const batteries = ordered.map(p => p.battery);
  const buckets = React.useMemo(() => hourlyBuckets(ordered, hours), [ordered, hours]);

  const hasAny = (points?.length ?? 0) > 0;

  const toggle = (
    <div role="group" aria-label="Time window" style={{ display: 'inline-flex', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      {([[24, '24h'], [168, '7d']] as const).map(([val, lbl]) => {
        const on = hours === val;
        return (
          <button key={val} type="button" onClick={() => setHours(val)} disabled={loading}
            style={{
              padding: '4px 12px', cursor: loading ? 'default' : 'pointer',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-mono)',
              border: 'none', background: on ? 'var(--brand)' : 'transparent',
              color: on ? '#fff' : 'var(--text-secondary)',
            }}>
            {lbl}
          </button>
        );
      })}
    </div>
  );

  return (
    <Card title="Activity" action={toggle} style={{ gridColumn: '1 / -1' }}>
      {loading && points === null ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>Loading activity…</p>
      ) : !hasAny ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: 8 }}>
          <Activity style={{ width: 28, height: 28, color: 'var(--text-subtle)' }} />
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', margin: 0 }}>
            {error ? 'Activity data is unavailable right now.' : 'No activity data yet.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-subtle)', marginBottom: 12 }}>
            {hours === 24 ? 'Last 24 hours' : 'Last 7 days'}
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <SparkLine values={speeds} color={BRAND} unit=" km/h" label="Activity (speed)" />
            <SparkLine values={batteries} color={SUCCESS} unit="%" label="Battery" />
            <ReportingBars buckets={buckets} label="Reporting activity" />
          </div>
        </>
      )}
    </Card>
  );
}
