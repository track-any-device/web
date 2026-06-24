import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { DevicesView, type AdminDeviceRow } from './devices-view';

export default async function AdminDevicesPage() {
  // Rows include the existing fields + the frozen lat/lon/name additions (degrade to empty).
  const { data: rows, error } = await fetchPortal<AdminDeviceRow>('/admin/devices');
  return (
    <>
      <PortalTopbar title="Devices" subtitle="Every device on the platform" right={<Button size="sm">Export</Button>} />
      <DevicesView rows={rows} loadError={error} />
    </>
  );
}
