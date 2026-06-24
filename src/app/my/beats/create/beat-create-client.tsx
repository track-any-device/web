'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import BeatForm from '../beat-form';

export default function BeatCreateClient() {
    const { token, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !token) {
            router.push('/login');
        }
    }, [token, loading, router]);

    // Keep the single portal satellite up until auth resolves.
    useTrackLoading(loading || !token);

    if (loading || !token) {
        return null; // the portal LoadingProvider overlay covers this area
    }

    return (
        <div className="mx-auto max-w-3xl p-4 space-y-6 sm:p-6 lg:p-8">
            <div>
                <a href="/my/devices" className="inline-flex items-center gap-1.5"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)' }}>
                    <ArrowLeft className="w-3.5 h-3.5" /> My devices
                </a>
                <h1 className="mt-2" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>New beat</h1>
                <p className="mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Draw a geofence polygon on the map.</p>
            </div>

            <BeatForm token={token} />
        </div>
    );
}
