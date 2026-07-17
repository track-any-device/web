import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { StatRow } from '@/components/tad/data-table';
import { TablePager, TableSearch } from '@/components/tad/table-controls';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type Device } from '@/lib/portal-data';
import { WorkshopClient } from './workshop-client';

export default async function WorkshopPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  await requirePortal('workshop');
  const { page, search } = await searchParams;

  const params = new URLSearchParams({ per_page: '100' });
  if (page) params.set('page', page);
  if (search) params.set('search', search);

  // Server-paginated (newest first) — recently registered devices, i.e. the ones
  // being provisioned, are on the early pages. Counts are page-local.
  const { data: all, meta, error } = await fetchPortal<Device>(`/ops/devices?${params.toString()}`);
  // Provisioning queue: devices still on the default tenant, or not yet provisioned (no SIM / pending).
  const queue = all.filter((d) => d.tenant?.isDefault || !d.sim || d.status === 'pending');
  return (
    <>
      <PortalTopbar title="Workshop — SIM & configuration" subtitle="Provision SIMs, set the broadcast id, and onboard the live device" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Awaiting SIM', value: all.filter((d) => !d.sim).length, hint: 'this page' },
          { label: 'In queue', value: queue.length, hint: 'this page' },
          { label: 'Devices', value: (meta?.total ?? all.length).toLocaleString() },
        ]} />
        <TableSearch placeholder="Search IMEI, name or broadcast id…" />
        <WorkshopClient queue={queue} loadError={error} />
        <TablePager meta={meta} />
      </div>
    </>
  );
}
