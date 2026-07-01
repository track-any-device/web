'use client';

import React from 'react';
import { staticMapUrl } from './static-map';

type Incident = {
  eventType: string | null;
  /** Human label from the API — distinguishes an exclusion-zone breach from a normal beat exit
   *  (both share eventType 'beat_violation'). Falls back to the local label() map when absent. */
  label?: string | null;
  priority: string | null;
  status: string | null;
  closed: boolean;
  triggeredAt: string | null;
  lat: number | null;
  lng: number | null;
  deviceLat?: number | null;
  deviceLng?: number | null;
  device: { name: string | null; imei: string | null } | null;
  silencedUntil: string | null;
};

const EVENT_LABEL: Record<string, string> = {
  sos: 'SOS',
  overspeed: 'Overspeed',
  low_battery: 'Low battery',
  beat_violation: 'Zone breach',
  device_offline: 'Device offline',
};

function label(t: string | null): string {
  if (!t) return 'Alert';
  return EVENT_LABEL[t] ?? t.replace(/_/g, ' ');
}

export function SilenceClient({ code }: { code: string }) {
  const [incident, setIncident] = React.useState<Incident | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/i/${code}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'This link has expired or is invalid.' : 'Could not load this alert.');
        return res.json();
      })
      .then((data) => { if (!cancelled) { setIncident(data); setDone(data.silencedUntil ? `Already silenced until ${new Date(data.silencedUntil).toLocaleString()}.` : null); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  async function silence(hours: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/i/${code}/silence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.message ?? 'Could not silence the alert.'); return; }
      setDone(`Alerts silenced for ${hours} hours.`);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tad" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg, #F7F4EF)' }}>
      <div className="tad-card tad-card--raised" style={{ maxWidth: 420, width: '100%', padding: 24 }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Loading…</p>
        ) : error ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, margin: 0 }}>Track Any Device</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 10 }}>{error}</p>
          </>
        ) : incident ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: incident.closed ? 'var(--text-subtle)' : 'var(--danger, #F0463C)' }} />
              <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-subtle)' }}>
                {incident.closed ? 'Resolved' : 'Active alert'}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {incident.label ?? label(incident.eventType)}
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              {incident.device?.name ?? 'Your device'}
              {incident.device?.imei && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}> · {incident.device.imei}</span>}
            </p>
            {incident.triggeredAt && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 6 }}>
                {new Date(incident.triggeredAt).toLocaleString()}
              </p>
            )}
            {incident.lat != null && incident.lng != null && (
              <div style={{ marginTop: 12 }}>
                {(() => {
                  const map = staticMapUrl({ lat: incident.lat, lng: incident.lng, deviceLat: incident.deviceLat, deviceLng: incident.deviceLng });
                  return map ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={map} alt="Alert location" style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border-subtle, #E7E0D6)', display: 'block' }} />
                  ) : null;
                })()}
                {incident.deviceLat != null && incident.deviceLng != null && (
                  <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    <span><span style={{ color: 'var(--danger, #F0463C)' }}>●</span> Alert</span>
                    <span><span style={{ color: '#1F9462' }}>●</span> Device now</span>
                  </div>
                )}
                <a href={`https://maps.google.com/?q=${incident.lat},${incident.lng}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--brand, #01411C)', fontWeight: 600 }}>
                  Open in Google Maps →
                </a>
              </div>
            )}

            <div style={{ height: 1, background: 'var(--border-subtle, #E7E0D6)', margin: '18px 0' }} />

            {incident.closed ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>This alert has been resolved — no further messages.</p>
            ) : done ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--brand, #01411C)', fontWeight: 600 }}>{done}</p>
            ) : (
              <>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 12 }}>Silence reminders for:</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[6, 12, 24].map((h) => (
                    <button key={h} disabled={busy} onClick={() => silence(h)}
                      className="tad-btn tad-btn--secondary" style={{ flex: 1 }}>
                      {h}h
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
