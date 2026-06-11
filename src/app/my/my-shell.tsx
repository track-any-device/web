'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { clearAuth } from '@/lib/auth-store';

export default function MyShell({ children }: { children: ReactNode }) {
    const { token, loading } = useAuth();

    useEffect(() => {
        if (!loading && !token) {
            window.location.href = '/api/auth/login';
        }
    }, [loading, token]);

    useEffect(() => {
        function onUnauthorized() {
            clearAuth();
            window.location.href = '/api/auth/login';
        }
        window.addEventListener('tad:unauthorized', onUnauthorized);
        return () => window.removeEventListener('tad:unauthorized', onUnauthorized);
    }, []);

    if (loading || !token) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <p className="text-sm text-gray-400">Loading…</p>
            </div>
        );
    }

    return <>{children}</>;
}
