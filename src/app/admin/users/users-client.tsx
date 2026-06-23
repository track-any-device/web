'use client';

import React from 'react';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { ROLE_LABEL, type PortalUser } from '@/lib/portal-data';

export function UsersClient({ initial, loadError }: { initial: PortalUser[]; loadError: string | null }) {
  const [rows, setRows] = React.useState<PortalUser[]>(initial);
  const [busy, setBusy] = React.useState<number | string | null>(null);

  async function act(u: PortalUser, kind: 'block' | 'unblock' | 'delete') {
    if (kind === 'delete' && !window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setBusy(u.id);
    try {
      const url = kind === 'delete' ? `/api/admin/users/${u.id}` : `/api/admin/users/${u.id}/${kind}`;
      const res = await fetch(url, { method: kind === 'delete' ? 'DELETE' : 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert(d?.message ?? 'Could not complete the action.');
        return;
      }
      setRows((r) => kind === 'delete'
        ? r.filter((x) => x.id !== u.id)
        : r.map((x) => (x.id === u.id ? { ...x, blocked: kind === 'block' } : x)));
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="tad-portal__body">
      <DataTable<PortalUser>
        empty={loadError ?? 'No users yet.'}
        rows={rows}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone', mono: true, render: (r) => r.phone ?? '—' },
          { key: 'role', header: 'Role', render: (r) => <Badge variant={r.role === 'admin' || r.role === 'core' ? 'brand' : 'neutral'}>{ROLE_LABEL[r.role] ?? r.role}</Badge> },
          { key: 'status', header: 'Status', render: (r) => r.blocked
            ? <Badge variant="danger">Blocked</Badge>
            : r.verified ? <Badge variant="success" dot>Active</Badge> : <Badge variant="warning">Pending</Badge> },
          { key: 'act', header: '', align: 'right', render: (r) => (
            <span style={{ display: 'inline-flex', gap: 8, justifyContent: 'flex-end' }}>
              {r.blocked
                ? <Button variant="ghost" size="sm" disabled={busy === r.id} onClick={() => act(r, 'unblock')}>Allow</Button>
                : <Button variant="ghost" size="sm" disabled={busy === r.id} onClick={() => act(r, 'block')}>Block</Button>}
              <Button variant="danger" size="sm" disabled={busy === r.id} onClick={() => act(r, 'delete')}>Delete</Button>
            </span>
          ) },
        ]}
      />
    </div>
  );
}
