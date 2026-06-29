import type { Metadata } from 'next';
import TenantDevicesClient from './tenant-devices-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Organisation devices' };

export default async function MyTenantDevicesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TenantDevicesClient tenantId={Number(id)} />;
}
