import type { Metadata } from 'next';
import DevicesClient from '../devices/devices-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Beats' };

// Same page as /my/devices — just the "Beats" tab active.
export default function MyBeatsPage() {
    return <DevicesClient initialTab="beats" />;
}
