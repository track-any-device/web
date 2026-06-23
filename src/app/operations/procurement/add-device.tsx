'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Badge } from '@/components/ui';
import type { OpsDeviceType } from '@/lib/portal-data';

const LS_KEY = 'tad_proc_device_type';

type Created = { id: number | string; imei: string; message?: string };

/** Procurement — register an incoming device by IMEI. Remembers the last-used device type. */
export function AddDevice() {
  const router = useRouter();

  const [types, setTypes] = React.useState<OpsDeviceType[]>([]);
  const [typesError, setTypesError] = React.useState<string | null>(null);
  const [deviceTypeId, setDeviceTypeId] = React.useState('');
  const [imei, setImei] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<Created | null>(null);

  // Load device types and pre-select the remembered one.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/ops/device-types', { headers: { Accept: 'application/json' } });
        if (!res.ok) { if (alive) setTypesError('Could not load device types.'); return; }
        const data = (await res.json().catch(() => [])) as OpsDeviceType[];
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        setTypes(list);
        const remembered = (typeof window !== 'undefined' && window.localStorage.getItem(LS_KEY)) || '';
        const valid = list.find((t) => String(t.id) === remembered);
        setDeviceTypeId(valid ? remembered : (list[0] ? String(list[0].id) : ''));
      } catch {
        if (alive) setTypesError('Could not load device types.');
      }
    })();
    return () => { alive = false; };
  }, []);

  function onTypeChange(value: string) {
    setDeviceTypeId(value);
    if (typeof window !== 'undefined') window.localStorage.setItem(LS_KEY, value);
  }

  const cleanImei = imei.replace(/\s+/g, '');
  const imeiValid = /^\d{14,17}$/.test(cleanImei);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cleanImei) { setError('Enter the device IMEI.'); return; }
    if (!imeiValid) { setError('IMEI should be 14–17 digits.'); return; }
    if (!deviceTypeId) { setError('Pick a device type.'); return; }
    if (busy) return;

    setBusy(true);
    try {
      const res = await fetch('/api/ops/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imei: cleanImei, device_type_id: Number(deviceTypeId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Could not register the device.');
        return;
      }
      setCreated({ id: data.id, imei: data.imei ?? cleanImei, message: data.message });
      setImei('');
      router.refresh(); // re-fetch the server-rendered device list
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tad-card" style={{ padding: 'var(--space-5)', gap: 'var(--space-4)' }}>
      <form onSubmit={add} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--space-4)', alignItems: 'end' }}>
        <Input
          label="Device IMEI"
          mono
          inputMode="numeric"
          placeholder="Scan or type the IMEI"
          value={imei}
          onChange={(e) => { setImei(e.target.value); setError(null); }}
          error={error && !imeiValid ? error : undefined}
          autoFocus
        />
        <Select
          label="Device type"
          value={deviceTypeId}
          onChange={(e) => onTypeChange(e.target.value)}
          disabled={types.length === 0}
          options={types.map((t) => ({ value: String(t.id), label: t.name }))}
        >
          {types.length === 0 && <option value="">No device types</option>}
        </Select>
        <Button type="submit" loading={busy} disabled={busy || !cleanImei || types.length === 0}>Add device</Button>
      </form>

      {typesError && (
        <div style={{ fontSize: 13, color: 'var(--danger)' }}>{typesError}</div>
      )}
      {error && imeiValid && (
        <div style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</div>
      )}
      {created && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--success)' }}>
          <Badge variant="success">Added</Badge>
          <span>
            {created.message ?? 'Device registered'} —{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{created.imei}</span>
          </span>
        </div>
      )}
    </div>
  );
}
