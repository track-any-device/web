import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type PortalUser } from '@/lib/portal-data';
import { UsersClient } from './users-client';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page, search } = await searchParams;

  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (search) params.set('search', search);
  const qs = params.toString();

  const { data, meta, error } = await fetchPortal<PortalUser>(`/admin/users${qs ? `?${qs}` : ''}`);
  return (
    <>
      <PortalTopbar title="Users" subtitle="People with access to the platform" />
      <UsersClient initial={data} meta={meta} loadError={error} />
    </>
  );
}
