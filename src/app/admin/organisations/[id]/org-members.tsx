'use client';

import React from 'react';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button, Card, Input } from '@/components/ui';
import { ROLE_LABEL, type PortalUser, type TenantMember } from '@/lib/portal-data';

/* Members of one organisation (the tenant_users pivot). Loads its own list via the BFF on mount,
   lets an admin add an existing user (search + select) and remove a member (with confirm). Real data
   only — empty list shows a friendly empty state, errors surface the API message. */

export function OrgMembers({ tenantId }: { tenantId: number | string }) {
  const [members, setMembers] = React.useState<TenantMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<number | string | null>(null);
  const [adding, setAdding] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/members`, { headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) { setLoadError((data as { message?: string })?.message ?? 'Could not load members.'); return; }
      setMembers(Array.isArray(data) ? (data as TenantMember[]) : []);
    } catch {
      setLoadError('Network error — could not load members.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => { void load(); }, [load]);

  async function remove(m: TenantMember) {
    if (!window.confirm(`Remove ${m.name} from this organisation? They keep their account — only their membership here is removed.`)) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/members/${m.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert((d as { message?: string })?.message ?? 'Could not remove the member.');
        return;
      }
      setMembers((rs) => rs.filter((x) => x.id !== m.id));
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card
      title="Members"
      action={<Button size="sm" onClick={() => setAdding(true)}>Add member</Button>}
    >
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        <DataTable<TenantMember>
          rows={members}
          empty={loadError ?? 'No members in this organisation yet. Add an existing user to get started.'}
          columns={[
            { key: 'name', header: 'Name', render: (m) => m.name },
            { key: 'contact', header: 'Email / Phone', render: (m) => m.email ?? m.primary_contact ?? '—' },
            { key: 'role', header: 'Role', render: (m) => <Badge variant={m.role === 'admin' || m.role === 'core' ? 'brand' : 'neutral'}>{ROLE_LABEL[m.role ?? ''] ?? m.role ?? '—'}</Badge> },
            { key: 'joinedAt', header: 'Joined', render: (m) => relTime(m.joinedAt) },
            { key: 'act', header: '', align: 'right', render: (m) => (
              <Button variant="danger" size="sm" disabled={busy === m.id} onClick={() => remove(m)}>Remove</Button>
            ) },
          ]}
        />
      )}

      {adding && (
        <AddMemberDialog
          existingIds={new Set(members.map((m) => String(m.id)))}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); void load(); }}
          tenantId={tenantId}
        />
      )}
    </Card>
  );
}

/* Pick an existing user to add. Fetches the platform user list once, filters client-side by
   name/email/phone, and POSTs the chosen user_id. Already-members are shown disabled. */
function AddMemberDialog({
  tenantId, existingIds, onClose, onAdded,
}: {
  tenantId: number | string;
  existingIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [users, setUsers] = React.useState<PortalUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState<number | string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await fetch('/api/admin/users', { headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ([]));
        if (!alive) return;
        if (!res.ok) { setError((data as { message?: string })?.message ?? 'Could not load users.'); return; }
        setUsers(Array.isArray(data) ? (data as PortalUser[]) : []);
      } catch {
        if (alive) setError('Network error — could not load users.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) =>
      (u.name ?? '').toLowerCase().includes(q)
      || (u.email ?? '').toLowerCase().includes(q)
      || (u.phone ?? '').toLowerCase().includes(q))
    : users;

  async function add(u: PortalUser) {
    setBusy(u.id);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: u.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        window.alert((d as { message?: string })?.message ?? 'Could not add the member.');
        return;
      }
      onAdded();
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
      <Card onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Add member</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Search for an existing platform user and add them to this organisation.
        </p>
        <Input placeholder="Search by name, email, or phone" value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
        <div style={{ marginTop: 14, maxHeight: 340, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 2px' }}>Loading users…</div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', fontSize: 13, padding: '12px 2px' }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 2px' }}>No matching users.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map((u) => {
                const member = existingIds.has(String(u.id));
                return (
                  <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email ?? u.phone ?? '—'}</div>
                    </div>
                    {member ? (
                      <Badge variant="success">Member</Badge>
                    ) : (
                      <Button size="sm" disabled={busy === u.id} onClick={() => add(u)}>Add</Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Button variant="ghost" onClick={onClose}>Done</Button>
        </div>
      </Card>
    </div>
  );
}

function relTime(ts?: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}
