import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type DeviceType } from '@/lib/portal-data';
import { DeviceTypesClient } from './device-types-client';

export default async function AdminDeviceTypesPage() {
  const { data, error } = await fetchPortal<DeviceType>('/admin/device-types');
  return (
    <>
      <PortalTopbar title="Device types" subtitle="The sellable catalogue" />
      <DeviceTypesClient initial={data} loadError={error} />
    </>
  );
}
