import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { IncidentsView } from './incidents-view';
import type { AdminIncidentRow } from './incidents-types';

const DEFAULT_DAYS = 7;

export default async function AdminIncidentsPage() {
  // Seed the initial list from a server fetch (default 7-day window). The client view
  // refetches through the BFF when the day filter changes.
  const { data: rows } = await fetchPortal<AdminIncidentRow>(`/admin/incidents?days=${DEFAULT_DAYS}`);
  return (
    <>
      <PortalTopbar title="Incidents" subtitle="Alerts raised across all devices" />
      <div className="tad-portal__body">
        <IncidentsView initialRows={rows} initialDays={DEFAULT_DAYS} />
      </div>
    </>
  );
}
