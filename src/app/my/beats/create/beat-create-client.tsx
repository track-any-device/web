'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import BeatForm from '../beat-form';

export default function BeatCreateClient() {
    const { token, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !token) {
            router.push('/login');
        }
    }, [token, loading, router]);

    if (loading || !token) {
        return <div className="p-8 text-sm text-gray-400">Loading…</div>;
    }

    return (
        <div className="p-8 max-w-3xl space-y-6">
            <div>
                <a href="/my/devices" className="text-xs text-blue-600 hover:underline">&larr; My Devices</a>
                <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">New Beat</h1>
                <p className="text-sm text-gray-500 mt-0.5">Draw a geofence polygon on the map.</p>
            </div>

            <BeatForm token={token} />
        </div>
    );
}
