'use client';

import React from 'react';

/* Customer device summary headline — thing name, current speed, last-fix age (live-ticking),
   online/offline, and the device type as a footer tag. Shows "—" for unknown values. Real data only.

   The /my Device shape exposes neither a public product SKU nor a separate model string, so the
   footer tag falls back to the device-type name. */

function relFix(iso: string | null): { value: string; unit: string } {
  if (!iso) return { value: '—', unit: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { value: '—', unit: '' };
  const sec = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return { value: String(sec), unit: 's ago' };
  const min = Math.round(sec / 60);
  if (min < 60) return { value: String(min), unit: 'm ago' };
  const hr = Math.round(min / 60);
  if (hr < 24) return { value: String(hr), unit: 'h ago' };
  return { value: String(Math.round(hr / 24)), unit: 'd ago' };
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>{label}</div>
      <div style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}

export function DeviceSummaryCard({ name, speed, lastSeenAt, online, battery, statusLabel, statusColor, productTag }: {
  name: string | null;
  speed: number | null;
  lastSeenAt: string | null;
  online?: boolean;
  battery?: number | null;
  /** Customer-facing status word (Moving / Idle / Offline). Falls back to live/offline. */
  statusLabel?: string;
  statusColor?: string;
  /** Footer tag — the device-type name (no public SKU on the /my shape). */
  productTag?: string | null;
}) {
  // Re-render every second so the "last fix" age stays current.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fix = relFix(lastSeenAt);
  const tag = productTag ?? '—';
  const dot = statusColor ?? (online ? 'var(--success)' : 'var(--text-subtle)');
  const word = statusLabel ?? (online ? 'live' : 'offline');

  return (
    <div className="tad-card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
          {name ?? 'Device'}
        </div>

        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '14px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 14, columnGap: 12 }}>
          <Stat label="Speed" value={speed != null ? String(Math.round(speed)) : '—'} unit={speed != null ? 'km/h' : ''} />
          <Stat label="Last fix" value={fix.value} unit={fix.unit} />
          <Stat label="Battery" value={battery != null ? String(Math.round(battery)) : '—'} unit={battery != null ? '%' : ''} />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>Status</div>
            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: statusColor ?? 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />
              {word}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--surface-sunken, var(--bg-subtle))', borderTop: '1px solid var(--border-subtle)', padding: '12px var(--space-5)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-subtle)' }}>Device type</span>
        <span style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 13 }}>
          {tag}
        </span>
      </div>
    </div>
  );
}
