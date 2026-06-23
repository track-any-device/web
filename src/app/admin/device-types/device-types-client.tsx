'use client';

import React from 'react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button, Card, Input, Switch } from '@/components/ui';
import { type DeviceType } from '@/lib/portal-data';

type Draft = { name: string; original_model: string; price_pkr: string; is_active: boolean; exclusion_exempt: boolean };
const EMPTY: Draft = { name: '', original_model: '', price_pkr: '', is_active: true, exclusion_exempt: false };

export function DeviceTypesClient({ initial, loadError }: { initial: DeviceType[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<DeviceType[]>(initial);
  const [editing, setEditing] = React.useState<DeviceType | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function openCreate() { setEditing(null); setDraft(EMPTY); setError(null); setShowForm(true); }
  function openEdit(t: DeviceType) {
    setEditing(t);
    setDraft({ name: t.name, original_model: t.originalModel ?? '', price_pkr: t.pricePkr != null ? String(t.pricePkr) : '', is_active: t.active, exclusion_exempt: !!t.exclusionExempt });
    setError(null); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const body = {
      name: draft.name.trim(),
      original_model: draft.original_model.trim() || null,
      price_pkr: draft.price_pkr.trim() ? Number(draft.price_pkr) : null,
      is_active: draft.is_active,
      exclusion_exempt: draft.exclusion_exempt,
    };
    try {
      const url = editing ? `/api/admin/device-types/${editing.id}` : '/api/admin/device-types';
      const res = await fetch(url, { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.message ?? 'Could not save the device type.'); return; }
      setRows((r) => editing ? r.map((x) => (x.id === editing.id ? data : x)) : [data, ...r]);
      setShowForm(false);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: DeviceType) {
    if (!window.confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/device-types/${t.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { window.alert(data?.message ?? 'Could not delete this device type.'); return; }
      setRows((r) => r.filter((x) => x.id !== t.id));
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatRow stats={[
          { label: 'Types', value: rows.length },
          { label: 'Active', value: rows.filter((t) => t.active).length },
          { label: 'Devices', value: rows.reduce((n, t) => n + (t.deviceCount || 0), 0) },
        ]} />
        <Button onClick={openCreate}>New device type</Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
            {editing ? `Edit ${editing.name}` : 'New device type'}
          </div>
          <form onSubmit={save} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <Input label="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. TAD Mini GPS" autoFocus required />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <Input label="Driver model" value={draft.original_model} onChange={(e) => setDraft({ ...draft, original_model: e.target.value })} placeholder="e.g. Concox_GT06N" />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <Input label="Price (PKR)" type="number" value={draft.price_pkr} onChange={(e) => setDraft({ ...draft, price_pkr: e.target.value })} placeholder="4999" />
            </div>
            <Switch label="Active" checked={draft.is_active} onChange={() => setDraft({ ...draft, is_active: !draft.is_active })} />
            <Switch label="Exempt from exclusion zones" checked={draft.exclusion_exempt} onChange={() => setDraft({ ...draft, exclusion_exempt: !draft.exclusion_exempt })} />
            <Button type="submit" loading={busy} disabled={busy}>{editing ? 'Save' : 'Create'}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </form>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </Card>
      )}

      <DataTable<DeviceType>
        empty={loadError ?? 'No device types yet — create the first one.'}
        rows={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'slug', header: 'Slug', mono: true },
          { key: 'originalModel', header: 'Driver model', mono: true, render: (r) => r.originalModel ?? '—' },
          { key: 'pricePkr', header: 'Price', align: 'right', mono: true, render: (r) => (r.pricePkr != null ? `Rs ${Number(r.pricePkr).toLocaleString()}` : '—') },
          { key: 'deviceCount', header: 'Devices', align: 'center', render: (r) => r.deviceCount ?? 0 },
          { key: 'active', header: 'Status', render: (r) => <Badge variant={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Hidden'}</Badge> },
          { key: 'exclusionExempt', header: 'Exclusion', render: (r) => <Badge variant={r.exclusionExempt ? 'neutral' : 'brand'}>{r.exclusionExempt ? 'Exempt' : 'Restricted'}</Badge> },
          { key: 'act', header: '', align: 'right', render: (r) => (
            <span style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
              <Button variant="danger" size="sm" disabled={busy} onClick={() => remove(r)}>Delete</Button>
            </span>
          ) },
        ]}
      />
    </div>
  );
}
