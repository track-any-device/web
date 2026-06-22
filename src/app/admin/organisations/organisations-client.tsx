'use client';

import React from 'react';
import Link from 'next/link';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button, Input, Card } from '@/components/ui';
import type { Tenant } from '@/lib/portal-data';

type Revealed = { id: number | string; name: string; key: string };

export function OrganisationsClient({ initial, loadError }: { initial: Tenant[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<Tenant[]>(initial);
  const [showForm, setShowForm] = React.useState(false);
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<Revealed | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Could not create the organisation.');
        return;
      }
      setRows((r) => [{ ...data, hasKey: true } as Tenant, ...r]);
      setRevealed({ id: data.tenantId ?? data.id, name: data.name, key: data.key });
      setName('');
      setShowForm(false);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function rotate(t: Tenant) {
    if (!window.confirm(`Issue a new connection key for ${t.name}? Its current key will stop working immediately.`)) return;
    const res = await fetch(`/api/admin/tenants/${t.id}/key`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setRevealed({ id: t.id, name: t.name, key: data.key });
      setRows((r) => r.map((x) => (x.id === t.id ? { ...x, hasKey: true } : x)));
    }
  }

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatRow stats={[
          { label: 'Organisations', value: rows.length },
          { label: 'With a connection key', value: rows.filter((t) => t.hasKey).length },
          { label: 'Devices managed', value: rows.reduce((n, t) => n + (t.devices || 0), 0) },
        ]} />
        <Button onClick={() => { setShowForm((s) => !s); setError(null); }}>
          {showForm ? 'Close' : 'New organisation'}
        </Button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={create} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Input label="Organisation name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Logistics" autoFocus />
            </div>
            <Button type="submit" loading={busy} disabled={busy}>Create &amp; issue key</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
          </form>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </Card>
      )}

      <DataTable<Tenant>
        rows={rows}
        empty={loadError ?? 'No organisations yet — create the first one to issue a connection key.'}
        columns={[
          { key: 'name', header: 'Organisation', render: (r) => <Link href={`/admin/organisations/${r.id}`} style={{ fontWeight: 600 }}>{r.name}</Link> },
          { key: 'slug', header: 'Slug', mono: true },
          { key: 'devices', header: 'Devices', align: 'center' },
          { key: 'members', header: 'Members', align: 'center' },
          { key: 'key', header: 'Connection key', render: (r) => r.hasKey
            ? <Badge variant="success">Active{r.lastUsed ? ` · used ${r.lastUsed}` : ''}</Badge>
            : <Badge variant="neutral">Not issued</Badge> },
          { key: 'act', header: '', align: 'right', render: (r) => (
            <span style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => rotate(r)}>{r.hasKey ? 'New key' : 'Issue key'}</Button>
              <Link href={`/admin/organisations/${r.id}`}><Button variant="ghost" size="sm">Manage</Button></Link>
            </span>
          ) },
        ]}
      />

      {revealed && <KeyDialog data={revealed} onClose={() => setRevealed(null)} />}
    </div>
  );
}

function KeyDialog({ data, onClose }: { data: Revealed; onClose: () => void }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(data.key); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
      <Card onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 540, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Connection key — {data.name}</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Copy this now — it is shown only once. Paste it into a server-tenant instance to connect and listen on the tenant channel.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          <KeyField label="Tenant ID — send as X-Tenant-Id" value={String(data.id)} />
          <KeyField label="Access key — send as Authorization: Bearer …" value={data.key} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="ghost" onClick={copy}>{copied ? 'Copied ✓' : 'Copy key'}</Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
}

function KeyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, background: 'var(--surface-sunken, #f3efe7)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}
