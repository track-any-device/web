import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import StreamClient from './stream-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Live Stream' };

export default async function LiveStreamPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/signin/sso');
    const api = new ApiClient(session.token);

    const user = session?.user as { sub?: string; id?: string | number } | undefined;
    const userId = String(user?.sub ?? user?.id ?? '0');

    let initialDevices: Awaited<ReturnType<typeof api.devices>>['data'] = [];
    try {
        const result = await api.devices();
        initialDevices = result.data;
    } catch {}

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Stream</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time device activity. Updates push automatically via WebSocket.</p>
            </div>

            {/* Real-time stream */}
            <StreamClient initialDevices={initialDevices} userId={userId} />
        </div>
    );
}
