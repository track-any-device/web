import React from 'react';
import { fetchPortal } from '@/lib/admin-api';
import { type ExclusionBeat } from '@/lib/portal-data';
import { ExclusionBeatsClient } from './exclusion-beats-client';

export default async function AdminExclusionBeatsPage() {
  const { data, error } = await fetchPortal<ExclusionBeat>('/admin/exclusion-beats');
  return <ExclusionBeatsClient initial={data} loadError={error} />;
}
