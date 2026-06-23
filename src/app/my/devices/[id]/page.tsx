import type { Metadata } from 'next';
import DeviceDetailClient from './device-detail-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Device' };

export default async function MyDeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <DeviceDetailClient deviceId={Number(id)} />;
}
