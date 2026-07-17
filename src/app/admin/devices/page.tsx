import React from 'react';
import { fetchPortal } from '@/lib/admin-api';
import { DevicesView, type AdminDeviceRow } from './devices-view';

export default async function AdminDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const { page, search, status } = await searchParams;

  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const qs = params.toString();

  // Server-paginated: one page of rows + meta; search/status filter on the API side.
  const { data: rows, meta, error } = await fetchPortal<AdminDeviceRow>(`/admin/devices${qs ? `?${qs}` : ''}`);
  return <DevicesView rows={rows} meta={meta} loadError={error} />;
}
