'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Badge } from '@/components/ui';
import type { Device, PendingBroadcast } from '@/lib/portal-data';

/* Workshop provisioning + onboarding.
   Left: queue → pick a device → enter Telecom (SIM) + PTA network IMEI (GSM) + broadcast id → Save (PATCH).
   Right: live broadcast-only devices (pending-broadcasts) → select the match → Onboard (merge into the
   provisioned record). The relationship is: provisioned record  ⟵  live broadcast (source). */

type Notice = { kind: 'success' | 'error'; text: string };

export function WorkshopClient({ queue, loadError }: { queue: Device[]; loadError: string | null }) {
  const router = useRouter();

  const [rows, setRows] = React.useState<Device[]>(queue);
  const [selectedId, setSelectedId] = React.useState<string | number | null>(queue[0]?.id ?? null);
  const selected = rows.find((d) => String(d.id) === String(selectedId)) ?? null;

  React.useEffect(() => { setRows(queue); }, [queue]);

  return (
    // Queue + provisioning split — stacks to one column below lg so it works down to 360px.
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,320px)_1fr] lg:gap-6">
      {/* Queue */}
      <div className="tad-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>
          Provisioning queue
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {loadError ?? 'Nothing to provision — every device has a SIM and is active.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((d) => {
              const active = String(d.id) === String(selectedId);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start',
                    padding: '11px 16px', textAlign: 'left', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)', border: 'none',
                    background: active ? 'var(--brand-subtle)' : 'transparent',
                    borderLeft: active ? '3px solid var(--brand)' : '3px solid transparent',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>{d.imei}</span>
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.model ?? 'Unknown model'}</span>
                    {!d.sim && <Badge variant="warning">No SIM</Badge>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Provisioning + onboarding */}
      {selected ? (
        <ProvisionPanel
          key={selected.id}
          device={selected}
          onSaved={(patch) => setRows((rs) => rs.map((d) => (d.id === selected.id ? { ...d, ...patch } : d)))}
          onMerged={() => router.refresh()}
        />
      ) : (
        <div className="tad-card" style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Pick a device from the queue to provision it.
        </div>
      )}
    </div>
  );
}

function ProvisionPanel({
  device,
  onSaved,
  onMerged,
}: {
  device: Device;
  onSaved: (patch: Partial<Device>) => void;
  onMerged: () => void;
}) {
  const [sim, setSim] = React.useState(device.sim ?? '');
  const [gsm, setGsm] = React.useState(device.gsm ?? '');
  const [broadcastId, setBroadcastId] = React.useState(device.broadcastId ?? '');
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ops/devices/${device.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim_number: sim.trim() || undefined,
          gsm_number: gsm.trim() || undefined,
          broadcast_id: broadcastId.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', text: data?.message ?? 'Could not save the configuration.' });
        return;
      }
      onSaved({ sim: sim.trim() || null, gsm: gsm.trim() || null, broadcastId: broadcastId.trim() || null });
      setNotice({ kind: 'success', text: data?.message ?? 'Configuration saved.' });
    } catch {
      setNotice({ kind: 'error', text: 'Network error — please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    // Configure + onboard side-by-side on desktop; stacked single column on phones/tablets.
    <div className="grid items-start gap-5 md:grid-cols-2">
      {/* Configuration */}
      <div className="tad-card" style={{ padding: 'var(--space-5)', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Configure device</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{device.imei}</div>
        </div>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Telecom number (SIM)"
            mono
            inputMode="tel"
            placeholder="e.g. 03001234567"
            value={sim}
            onChange={(e) => setSim(e.target.value)}
            hint="The phone number of the SIM fitted to this device."
          />
          <Input
            label="PTA network IMEI (GSM)"
            mono
            inputMode="numeric"
            placeholder="Network-registered IMEI"
            value={gsm}
            onChange={(e) => setGsm(e.target.value)}
            hint="The PTA-registered IMEI of the SIM module."
          />
          <Input
            label="Broadcast ID"
            mono
            placeholder="Matching live broadcast id"
            value={broadcastId}
            onChange={(e) => setBroadcastId(e.target.value)}
            hint="The id this device broadcasts on. Set it here or onboard a live broadcast on the right."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="submit" loading={saving} disabled={saving}>Save configuration</Button>
            {notice && (
              <span style={{ fontSize: 13, color: notice.kind === 'success' ? 'var(--success)' : 'var(--danger)' }}>
                {notice.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Onboarding / merge */}
      <OnboardPanel device={device} onMerged={onMerged} />
    </div>
  );
}

function OnboardPanel({ device, onMerged }: { device: Device; onMerged: () => void }) {
  const [pending, setPending] = React.useState<PendingBroadcast[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [sourceId, setSourceId] = React.useState<string | number | null>(null);
  const [merging, setMerging] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch('/api/ops/pending-broadcasts', { headers: { Accept: 'application/json' } });
      if (!res.ok) { setListError('Could not load pending broadcasts.'); setPending([]); return; }
      const data = (await res.json().catch(() => [])) as PendingBroadcast[];
      setPending(Array.isArray(data) ? data : []);
    } catch {
      setListError('Could not load pending broadcasts.');
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function merge() {
    if (sourceId == null || merging) return;
    setMerging(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ops/devices/${device.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: Number(sourceId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', text: data?.message ?? 'Could not onboard the broadcast.' });
        return;
      }
      setNotice({ kind: 'success', text: data?.message ?? 'Onboarded — live broadcast linked.' });
      setSourceId(null);
      await load();
      onMerged();
    } catch {
      setNotice({ kind: 'error', text: 'Network error — please try again.' });
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="tad-card" style={{ padding: 'var(--space-5)', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Onboard live broadcast</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>
            Pick the live broadcast that belongs to{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{device.imei}</span>, then onboard it.
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      {/* relationship hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <Badge variant="brand">Provisioned</Badge>
        <span aria-hidden="true">⟵</span>
        <Badge variant="warning">Live broadcast</Badge>
      </div>

      {loading ? (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
      ) : pending.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {listError ?? 'No live broadcasts waiting to be onboarded.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {pending.map((p) => {
            const active = String(p.id) === String(sourceId);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSourceId(p.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  padding: '10px 12px', textAlign: 'left', cursor: 'pointer', border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: active ? 'var(--brand-subtle)' : 'transparent',
                }}
              >
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>{p.broadcastId ?? '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.model ?? 'Unknown'}{p.lastSeen ? ` · seen ${p.lastSeen}` : ''}</span>
                </span>
                {active && <Badge variant="brand">Selected</Badge>}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button onClick={merge} loading={merging} disabled={merging || sourceId == null}>Onboard selected</Button>
        {notice && (
          <span style={{ fontSize: 13, color: notice.kind === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {notice.text}
          </span>
        )}
      </div>
    </div>
  );
}
