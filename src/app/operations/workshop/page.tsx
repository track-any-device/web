import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { StatRow } from '@/components/tad/data-table';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type Device } from '@/lib/portal-data';
import { WorkshopClient } from './workshop-client';

export default async function WorkshopPage() {
  await requirePortal('workshop');
  const { data: all, error } = await fetchPortal<Device>('/ops/devices');
  // Provisioning queue: devices still on the default tenant, or not yet provisioned (no SIM / pending).
  const queue = all.filter((d) => d.tenant?.isDefault || !d.sim || d.status === 'pending');
  return (
    <>
      <PortalTopbar title="Workshop — SIM & configuration" subtitle="Provision SIMs, set the broadcast id, and onboard the live device" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Awaiting SIM', value: all.filter((d) => !d.sim).length },
          { label: 'In queue', value: queue.length },
          { label: 'Configured', value: all.filter((d) => d.sim && d.status === 'active').length },
        ]} />
        <WorkshopClient queue={queue} loadError={error} />
      </div>
    </>
  );
}
