import React from 'react';
import Link from 'next/link';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortalOne } from '@/lib/admin-api';
import { type TenantDetail } from '@/lib/portal-data';
import { OrgDetailTabs } from './org-detail-tabs';

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: t, error } = await fetchPortalOne<TenantDetail>(`/admin/tenants/${id}`);

  if (!t) {
    return (
      <>
        <PortalTopbar title="Organisation" subtitle="Tenant detail" />
        <div className="tad-portal__body">
          <div className="tad-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
            {error ?? 'Organisation not found.'}{' '}
            <Link href="/admin/organisations" style={{ fontWeight: 600 }}>Back to organisations</Link>
          </div>
        </div>
      </>
    );
  }

  const { data: fwd } = await fetchPortalOne<{ transport: string }>(`/admin/tenants/${id}/forwarding`);

  return (
    <>
      <PortalTopbar title={t.name} subtitle={`Organisation · ${t.slug}`} />
      <OrgDetailTabs tenant={t} transport={fwd?.transport ?? 'tad101_channel'} loadError={error} />
    </>
  );
}
