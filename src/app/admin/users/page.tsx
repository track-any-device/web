import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type PortalUser } from '@/lib/portal-data';
import { UsersClient } from './users-client';

export default async function AdminUsersPage() {
  const { data, error } = await fetchPortal<PortalUser>('/admin/users');
  return (
    <>
      <PortalTopbar title="Users" subtitle="People with access to the platform" />
      <UsersClient initial={data} loadError={error} />
    </>
  );
}
