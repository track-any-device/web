'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Select } from '@/components/ui';
import { updateDeviceOwnership } from '@/lib/admin-api-client';
import type { AdminDeviceDetail } from '@/lib/portal-data';

/* Editable "Ownership" card for /admin/devices/[id].
   - View mode: shows owner, organisation, registered date (matches the original card).
   - Edit mode: pick an Owner (searchable user list) + an Organisation (tenant select with an
     "Unassigned" option), then save → PATCH /api/admin/devices/{id} via the BFF, refresh the page.
   Real data only — pickers are fed the live user/tenant lists from the server component. */

export interface UserOption { id: number | string; name: string | null; email?: string | null }
export interface TenantOption { id: number | string; name: string; slug?: string | null }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--text-2xs)', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-subtle)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)' }}>{children}</span>
    </div>
  );
}

export function OwnershipCard({
  device,
  users,
  tenants,
}: {
  device: AdminDeviceDetail;
  users: UserOption[];
  tenants: TenantOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [ownerId, setOwnerId] = React.useState<string>(device.owner ? String(device.owner.id) : '');
  const [tenantId, setTenantId] = React.useState<string>(device.tenant ? String(device.tenant.id) : '');
  const [userQuery, setUserQuery] = React.useState('');

  const filteredUsers = React.useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 50);
    return users
      .filter((u) => `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [users, userQuery]);

  function startEdit() {
    setOwnerId(device.owner ? String(device.owner.id) : '');
    setTenantId(device.tenant ? String(device.tenant.id) : '');
    setUserQuery('');
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await updateDeviceOwnership(device.id, {
      user_id: ownerId === '' ? null : Number(ownerId),
      tenant_id: tenantId === '' ? null : Number(tenantId),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not save ownership.');
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <Card title="Ownership" action={<Button variant="ghost" size="sm" onClick={startEdit}>Edit</Button>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Owner">
            {device.owner ? `${device.owner.name} · ${device.owner.email}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
          </Field>
          <Field label="Organisation">
            {device.tenant ? <Link href={`/admin/organisations/${device.tenant.id}`}>{device.tenant.name}</Link> : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
          </Field>
          <Field label="Registered">{device.createdAt ?? '—'}</Field>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Ownership">
      <div style={{ display: 'grid', gap: 14 }}>
        {/* Owner: search + select. Keeps the list small + mobile-friendly. */}
        <div style={{ display: 'grid', gap: 8 }}>
          <Input
            label="Owner"
            placeholder="Search users by name or email…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
          />
          <Select
            aria-label="Owner"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {/* Keep the current owner selectable even if it falls outside the filtered/visible set. */}
            {device.owner && !filteredUsers.some((u) => String(u.id) === String(device.owner!.id)) && (
              <option value={String(device.owner.id)}>{device.owner.name} · {device.owner.email}</option>
            )}
            {filteredUsers.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {(u.name ?? 'Unnamed') + (u.email ? ` · ${u.email}` : '')}
              </option>
            ))}
          </Select>
        </div>

        {/* Organisation: tenant select with an Unassigned option. */}
        <Select
          label="Organisation"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {tenants.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.name}</option>
          ))}
        </Select>

        {error && <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" onClick={save} loading={busy} disabled={busy}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setError(null); }} disabled={busy}>Cancel</Button>
        </div>
      </div>
    </Card>
  );
}
