import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import type { Metadata } from 'next';
import BeatsMapView from './beats-map-view';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Beats' };

export default async function MyBeatsPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');

    const api = new ApiClient(session.token);
    let beats: Awaited<ReturnType<typeof api.beats>>['data'] = [];
    try {
        const res = await api.beats();
        beats = res.data;
    } catch {}

    return <BeatsMapView beats={beats} token={session.token} />;
}
