import type { Metadata } from 'next';
import DevicesClient from './devices-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Devices' };

export default function MyDevicesPage() {
    return <DevicesClient />;
}
