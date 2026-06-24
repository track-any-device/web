'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { clearAuth } from '@/lib/auth-store';
import { PortalLoader } from '@/components/tad/portal-loader';

export default function MyShell({ children }: { children: ReactNode }) {
    const { token, loading } = useAuth();

    useEffect(() => {
        if (!loading && !token) {
            window.location.href = '/login';
        }
    }, [loading, token]);

    useEffect(() => {
        function onUnauthorized() {
            clearAuth();
            window.location.href = '/login';
        }
        window.addEventListener('tad:unauthorized', onUnauthorized);
        return () => window.removeEventListener('tad:unauthorized', onUnauthorized);
    }, []);

    // Auth gate (chrome can't render until we have a user). Show the SAME satellite
    // visual as the in-portal LoadingProvider so the loader is one continuous
    // satellite from the very first paint — never a bare "Loading…" then a satellite.
    if (loading || !token) {
        return (
            <div className="tad" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <PortalLoader />
            </div>
        );
    }

    return <>{children}</>;
}
