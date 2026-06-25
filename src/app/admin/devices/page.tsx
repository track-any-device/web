import React from 'react';
import { fetchPortal } from '@/lib/admin-api';
import { DevicesView, type AdminDeviceRow } from './devices-view';

export default async function AdminDevicesPage() {
  // Rows include the existing fields + the frozen lat/lon/name additions (degrade to empty).
  const { data: rows, error } = await fetchPortal<AdminDeviceRow>('/admin/devices');
  return <DevicesView rows={rows} loadError={error} />;
}
