'use client';

import { useEffect, useState } from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
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

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-6 sm:p-6 lg:p-8">
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                My tenants ({tenants.length})
            </h1>

            {apiError && (
                <div className="rounded-lg px-4 py-3 break-all"
                    style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                    {apiError}
                </div>
            )}

            {!apiError && tenants.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center gap-3">
                    <Building2 className="w-10 h-10" style={{ color: 'var(--text-subtle)' }} />
                    <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>No organisations yet</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>You&apos;ll appear here when an admin adds you to an organisation.</p>
                </div>
            )}

            {!apiError && tenants.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tenants.map((tenant) => (
                        <a key={tenant.id} href={tenant.portal_url}
                            target="_blank" rel="noopener noreferrer"
                            className="tad-card tad-card--interactive group">
                            <div className="tad-card__body flex items-center gap-4">
                                {tenant.logo_url ? (
                                    <Image
                                        src={tenant.logo_url}
                                        alt={tenant.name}
                                        width={48}
                                        height={48}
                                        className="rounded-lg object-contain shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--pak-700), var(--pak-400))' }}>
                                        <span style={{ color: '#fff', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-display)' }}>
                                            {(tenant.app_name ?? tenant.name).charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate inline-flex items-center gap-1"
                                        style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                        {tenant.app_name ?? tenant.name}
                                        <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brand)' }} />
                                    </p>
                                    <p className="truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{tenant.slug}.track-any-device.com</p>
                                    <span className={`inline-block mt-1.5 capitalize ${
                                        tenant.status === 'approved'
                                            ? 'tad-badge tad-badge--success'
                                            : 'tad-badge tad-badge--neutral'
                                    }`}>
                                        {tenant.status}
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
