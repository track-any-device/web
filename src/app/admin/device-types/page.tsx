import React from 'react';
import { fetchPortal } from '@/lib/admin-api';
import { type DeviceType } from '@/lib/portal-data';
import { DeviceTypesClient } from './device-types-client';

export default async function AdminDeviceTypesPage() {
  const { data, error } = await fetchPortal<DeviceType>('/admin/device-types');
  return <DeviceTypesClient initial={data} loadError={error} />;
}
