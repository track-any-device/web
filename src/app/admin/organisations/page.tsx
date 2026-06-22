import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type Tenant } from '@/lib/portal-data';
import { OrganisationsClient } from './organisations-client';

export default async function AdminOrganisationsPage() {
  const { data, error } = await fetchPortal<Tenant>('/admin/tenants');
  return (
    <>
      <PortalTopbar title="Organisations" subtitle="Tenant accounts (B2B fleets) and their connection keys" />
      <OrganisationsClient initial={data} loadError={error} />
    </>
  );
}
