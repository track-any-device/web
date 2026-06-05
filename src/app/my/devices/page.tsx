import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import type { Metadata } from 'next';
import DevicesView from './devices-view';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Devices' };

export default async function MyDevicesPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');

    const api = new ApiClient(session.token);

    const [devicesRes, incidentsRes] = await Promise.allSettled([
        api.devices(),
        api.incidents({ status: 'open,acknowledged,escalated', per_page: '50' }),
    ]);

    const devices   = devicesRes.status   === 'fulfilled' ? devicesRes.value.data   : [];
    const incidents = incidentsRes.status === 'fulfilled' ? incidentsRes.value.data : [];

    return <DevicesView devices={devices} incidents={incidents} />;
}
