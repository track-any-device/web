import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type ExclusionBeat } from '@/lib/portal-data';
import { ExclusionBeatsClient } from './exclusion-beats-client';

export default async function AdminExclusionBeatsPage() {
  const { data, error } = await fetchPortal<ExclusionBeat>('/admin/exclusion-beats');
  return (
    <>
      <PortalTopbar title="Exclusion zones" subtitle="No-go areas — every device is restricted unless its type is exempt" />
      <ExclusionBeatsClient initial={data} loadError={error} />
    </>
  );
}
