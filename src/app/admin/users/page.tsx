import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { USERS, type PortalUser } from '@/lib/portal-data';

const ROLE: Record<PortalUser['role'], 'brand' | 'neutral' | 'success'> = {
  Admin: 'brand', Core: 'brand', Procurement: 'neutral', Workshop: 'neutral',
  DeliveryOrder: 'neutral', TenantUser: 'success', User: 'neutral',
};

export default function AdminUsersPage() {
  return (
    <>
      <PortalTopbar title="Users" subtitle="People with access to the platform" right={<Button size="sm">Invite user</Button>} />
      <div className="tad-portal__body">
        <DataTable<PortalUser>
          rows={USERS}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'phone', header: 'Phone', mono: true },
            { key: 'role', header: 'Role', render: (r) => <Badge variant={ROLE[r.role]}>{r.role}</Badge> },
            { key: 'verified', header: 'Verified', render: (r) => r.verified ? <Badge variant="success" dot>Verified</Badge> : <Badge variant="warning">Pending</Badge> },
            { key: 'act', header: '', align: 'right', render: () => <Button variant="ghost" size="sm">Edit</Button> },
          ]}
        />
      </div>
    </>
  );
}
