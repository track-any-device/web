import React from 'react';
import { fetchPortal } from '@/lib/admin-api';
import { OrganisationsList, type TenantRow } from './organisations-list';

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page, search } = await searchParams;

  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (search) params.set('search', search);
  const qs = params.toString();

  // Frozen contract: rows now also carry { transport, forwardingEnabled, delivery, activity7d }.
  // Typed locally as TenantRow (superset of portal-data's Tenant); the new fields are optional so
  // the list degrades gracefully until the backend ships them.
  const { data, meta, error } = await fetchPortal<TenantRow>(`/admin/tenants${qs ? `?${qs}` : ''}`);
  return <OrganisationsList initial={data} meta={meta} loadError={error} />;
}
