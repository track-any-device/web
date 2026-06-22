import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { ROLE_LABEL, type PortalUser } from '@/lib/portal-data';

export default async function AdminUsersPage() {
  const { data: rows, error } = await fetchPortal<PortalUser>('/admin/users');
  return (
    <>
      <PortalTopbar title="Users" subtitle="People with access to the platform" right={<Button size="sm">Invite user</Button>} />
      <div className="tad-portal__body">
        <DataTable<PortalUser>
          empty={error ?? 'No users yet.'}
          rows={rows}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone', mono: true, render: (r) => r.phone ?? '—' },
            { key: 'role', header: 'Role', render: (r) => <Badge variant={r.role === 'admin' || r.role === 'core' ? 'brand' : 'neutral'}>{ROLE_LABEL[r.role] ?? r.role}</Badge> },
            { key: 'verified', header: 'Verified', render: (r) => r.verified ? <Badge variant="success" dot>Verified</Badge> : <Badge variant="warning">Pending</Badge> },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">Edit</Button> },
          ]}
        />
      </div>
    </>
  );
}
