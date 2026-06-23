import type { Metadata } from 'next';
import DevicesClient from '../devices/devices-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Trips' };

// Same page as /my/devices — just the "Trips" tab active.
export default function MyTripsPage() {
    return <DevicesClient initialTab="trips" />;
}
