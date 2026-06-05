'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';
import type { TenantSummary } from '@/lib/api-client';
import Image from 'next/image';

export default function TenantsClient() {
    const { token } = useAuth();
    const [tenants, setTenants] = useState<TenantSummary[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.tenants()
            .then((data) => {
                setTenants(data);
            })
            .catch((e) => {
                setApiError(e instanceof Error ? e.message : String(e));
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <div className="p-8 text-sm text-gray-400">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Tenants ({tenants.length})
            </h1>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-mono break-all">
                    {apiError}
                </div>
            )}

            {!apiError && tenants.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-3">🏢</p>
                    <p className="text-lg font-medium">No organizations yet</p>
                    <p className="text-sm mt-1">You&apos;ll appear here when an admin adds you to an organization.</p>
                </div>
            )}

            {!apiError && tenants.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tenants.map((tenant) => (
                        <a key={tenant.id} href={tenant.portal_url}
                            target="_blank" rel="noopener noreferrer"
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 transition-colors group flex items-center gap-4">
                            {tenant.logo_url ? (
                                <Image
                                    src={tenant.logo_url}
                                    alt={tenant.name}
                                    width={48}
                                    height={48}
                                    className="rounded-lg object-contain shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
                                    <span className="text-white text-lg font-bold">
                                        {(tenant.app_name ?? tenant.name).charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                    {tenant.app_name ?? tenant.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{tenant.slug}.track-any-device.com</p>
                                <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                                    tenant.status === 'approved'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tenant.status}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
