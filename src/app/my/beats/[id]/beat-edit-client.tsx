'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { BeatDetail } from '@/lib/api-client';
import BeatForm from '../beat-form';
import DeleteBeatButton from './delete-button';

export default function BeatEditClient({ id }: { id: string }) {
    const { token, loading: authLoading } = useAuth();
    const router = useRouter();
    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!token) { router.push('/api/auth/login'); return; }

        const api = new ApiClient(token);
        api.beat(Number(id))
            .then(setBeat)
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [token, authLoading, id, router]);

    if (authLoading || loading) {
        return <div className="p-8 text-sm text-gray-400">Loading…</div>;
    }

    if (notFound) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Beat not found.{' '}
                <a href="/my/beats" className="text-blue-600 hover:underline">Back to My Beats</a>
            </div>
        );
    }

    if (!beat || !token) return null;

    return (
        <div className="p-8 max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <a href="/my/devices" className="text-xs text-blue-600 hover:underline">&larr; My Devices</a>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{beat.name}</h1>
                    {beat.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{beat.description}</p>
                    )}
                </div>
                <DeleteBeatButton beatId={beat.id} token={token} />
            </div>

            <BeatForm token={token} beat={beat} />
        </div>
    );
}
