import React from 'react';

/* Per-device heartbeat indicator: a live/quiet pulse dot, the time since the last beat, and the
   device's current beat interval (its "heart rate"). All values come from real heartbeat frames
   recorded by the protocol servers — nothing is synthesised. */

export function formatRate(seconds?: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  if (seconds < 120) return `every ~${seconds}s`;
  const m = Math.round(seconds / 60);
  return `every ~${m} min`;
}

export function HeartbeatCell({
  online,
  at,
  intervalS,
}: {
  online?: boolean;
  at?: string | null;
  intervalS?: number | null;
}) {
  const rate = formatRate(intervalS);
  if (!at && !online) {
    return <span style={{ color: 'var(--text-muted)' }}>No heartbeat yet</span>;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        title={online ? 'beating' : 'no recent beat'}
        style={{
          width: 8, height: 8, borderRadius: 99, flex: 'none',
          background: online ? 'var(--success)' : 'var(--text-muted)',
          boxShadow: online ? '0 0 0 3px color-mix(in srgb, var(--success) 25%, transparent)' : 'none',
        }}
      />
      <span style={{ lineHeight: 1.25 }}>
        <span style={{ fontSize: 13 }}>{at ?? (online ? 'just now' : '—')}</span>
        {rate && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{rate}</span>}
      </span>
    </span>
  );
}
