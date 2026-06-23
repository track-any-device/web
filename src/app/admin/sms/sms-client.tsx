'use client';

import React from 'react';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button, Input, Card, Tabs } from '@/components/ui';
import type { OutgoingSmsRow, IncomingSmsRow } from '@/lib/portal-data';

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning', sent: 'success', failed: 'danger',
};

function truncate(s: string, n = 80) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function when(s: string | null) {
  return s ? new Date(s).toLocaleString() : '—';
}

export function SmsClient({
  outgoing, incoming, outError, inError,
}: {
  outgoing: OutgoingSmsRow[];
  incoming: IncomingSmsRow[];
  outError: string | null;
  inError: string | null;
}) {
  const [tab, setTab] = React.useState<'outgoing' | 'incoming'>('outgoing');
  const [rows, setRows] = React.useState<OutgoingSmsRow[]>(outgoing);

  const [showForm, setShowForm] = React.useState(false);
  const [recipient, setRecipient] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const counts = {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    sent: rows.filter((r) => r.status === 'sent').length,
    failed: rows.filter((r) => r.status === 'failed').length,
  };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !message.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/sms/outgoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: recipient.trim(), message: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'Could not queue the SMS.');
        return;
      }
      setRows((r) => [data as OutgoingSmsRow, ...r]);
      setRecipient('');
      setMessage('');
      setShowForm(false);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tad-portal__body">
      <Tabs
        variant="pill"
        value={tab}
        onChange={(v) => setTab(v as 'outgoing' | 'incoming')}
        items={[
          { value: 'outgoing', label: 'Outgoing', count: counts.total },
          { value: 'incoming', label: 'Incoming', count: incoming.length },
        ]}
        style={{ marginBottom: 16 }}
      />

      {tab === 'outgoing' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <StatRow stats={[
              { label: 'Total', value: counts.total },
              { label: 'Pending', value: counts.pending },
              { label: 'Sent', value: counts.sent },
              { label: 'Failed', value: counts.failed },
            ]} />
            <Button onClick={() => { setShowForm((s) => !s); setError(null); }}>
              {showForm ? 'Close' : 'Send SMS'}
            </Button>
          </div>

          {showForm && (
            <Card style={{ marginBottom: 16 }}>
              <form onSubmit={send} style={{ display: 'grid', gap: 10 }}>
                <div style={{ maxWidth: 320 }}>
                  <Input label="Recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="+923XXXXXXXXX" autoFocus />
                </div>
                <Input label="Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type the message to send" />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button type="submit" loading={busy} disabled={busy}>Send</Button>
                  <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(null); }}>Cancel</Button>
                </div>
                {error && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
              </form>
            </Card>
          )}

          <DataTable<OutgoingSmsRow>
            rows={rows}
            empty={outError ?? 'No outbound messages yet.'}
            columns={[
              { key: 'to', header: 'To', mono: true },
              { key: 'message', header: 'Message', render: (r) => truncate(r.message) },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'}>{r.status}</Badge> },
              { key: 'source', header: 'Source' },
              { key: 'attempts', header: 'Attempts', align: 'center' },
              { key: 'createdAt', header: 'Created', render: (r) => when(r.createdAt) },
              { key: 'error', header: 'Error', render: (r) => r.error ? <span style={{ color: 'var(--danger)' }}>{r.error}</span> : '—' },
            ]}
          />
        </>
      ) : (
        <DataTable<IncomingSmsRow>
          rows={incoming}
          empty={inError ?? 'No inbound messages yet.'}
          columns={[
            { key: 'from', header: 'From', mono: true },
            { key: 'message', header: 'Message', render: (r) => truncate(r.message) },
            { key: 'source', header: 'Source' },
            { key: 'receivedAt', header: 'Received', render: (r) => when(r.receivedAt) },
            { key: 'processedAt', header: 'Processed', render: (r) => when(r.processedAt) },
          ]}
        />
      )}
    </div>
  );
}
