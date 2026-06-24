'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
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
        if (!token) { router.push('/login'); return; }

        const api = new ApiClient(token);
        api.beat(Number(id))
            .then(setBeat)
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [token, authLoading, id, router]);

    // Keep the single portal satellite up until auth + this beat have loaded.
    useTrackLoading(authLoading || loading);

    if (authLoading || loading) {
        return null; // the portal LoadingProvider overlay covers this area
    }

    if (notFound) {
        return (
            <div className="p-8" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Beat not found.{' '}
                <a href="/my/beats" style={{ color: 'var(--brand)' }}>Back to my beats</a>
            </div>
        );
    }

    if (!beat || !token) return null;

    return (
        <div className="mx-auto max-w-3xl p-4 space-y-6 sm:p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <a href="/my/devices" className="inline-flex items-center gap-1.5"
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)' }}>
                        <ArrowLeft className="w-3.5 h-3.5" /> My devices
                    </a>
                    <h1 className="mt-2" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>{beat.name}</h1>
                    {beat.description && (
                        <p className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{beat.description}</p>
                    )}
                </div>
                <DeleteBeatButton beatId={beat.id} token={token} />
            </div>

            <BeatForm token={token} beat={beat} />
        </div>
    );
}
