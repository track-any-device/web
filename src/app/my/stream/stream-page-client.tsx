'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { Device } from '@/lib/api-client';
import StreamClient from './stream-client';

export default function StreamPageClient() {
    const { token, user } = useAuth();
    const [initialDevices, setInitialDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = String(user?.sub ?? '0');

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.devices()
            .then(result => setInitialDevices(result.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Stream</h1>
                <p className="text-sm text-gray-500 mt-1">Real-time device activity. Updates push automatically via WebSocket.</p>
            </div>
            <StreamClient initialDevices={initialDevices} token={token!} userId={userId} />
        </div>
    );
}
