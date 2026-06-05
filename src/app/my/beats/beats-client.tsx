'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { Beat } from '@/lib/api-client';
import BeatsMapView from './beats-map-view';

export default function BeatsClient() {
    const { token } = useAuth();
    const [beats, setBeats] = useState<Beat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.beats()
            .then(res => setBeats(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;

    return <BeatsMapView beats={beats} token={token!} />;
}
