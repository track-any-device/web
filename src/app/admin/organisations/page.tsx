import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { OrganisationsList, type TenantRow } from './organisations-list';

export default async function AdminOrganisationsPage() {
  // Frozen contract: rows now also carry { transport, forwardingEnabled, delivery, activity7d }.
  // Typed locally as TenantRow (superset of portal-data's Tenant); the new fields are optional so
  // the list degrades gracefully until the backend ships them.
  const { data, error } = await fetchPortal<TenantRow>('/admin/tenants');
  return (
    <>
      <PortalTopbar title="Organisations" subtitle="Tenant accounts (B2B fleets), their transport and delivery" />
      <OrganisationsList initial={data} loadError={error} />
    </>
  );
}
