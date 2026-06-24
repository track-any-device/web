'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { Device } from '@/lib/api-client';
import StreamClient from './stream-client';

export default function StreamPageClient() {
    const { token, user } = useAuth();
    const [initialDevices, setInitialDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);

    const userId = String(user?.id ?? user?.sub ?? '0');

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.devices()
            .then(result => setInitialDevices(result.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <div className="mx-auto max-w-5xl p-4 space-y-6 sm:p-6 lg:p-8">
            <div>
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>Live Stream</h1>
                <p className="mt-1" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Real-time device activity. Updates push automatically via WebSocket.</p>
            </div>
            <StreamClient initialDevices={initialDevices} token={token!} userId={userId} />
        </div>
    );
}
