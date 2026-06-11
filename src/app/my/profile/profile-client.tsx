'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient, type UserProfile, type TenantSummary } from '@/lib/api-client';

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    admin:       { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Admin'       },
    supervisor:  { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Supervisor'  },
    tenant_user: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Tenant User' },
    user:        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'User'        },
};

const TENANT_STATUS_DOT: Record<string, string> = {
    active:   'bg-green-500',
    inactive: 'bg-gray-400',
    trial:    'bg-yellow-400',
    suspended:'bg-red-500',
};

export default function ProfileClient() {
    const { token, user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile,      setProfile]      = useState<UserProfile | null>(null);
    const [tenants,      setTenants]      = useState<TenantSummary[]>([]);
    const [deviceCount,  setDeviceCount]  = useState<number>(0);
    const [loading,      setLoading]      = useState(true);

    // Tenant request form
    const [showRequest,  setShowRequest]  = useState(false);
    const [orgName,      setOrgName]      = useState('');
    const [reqMessage,   setReqMessage]   = useState('');
    const [submitting,   setSubmitting]   = useState(false);
    const [reqSuccess,   setReqSuccess]   = useState(false);
    const [reqError,     setReqError]     = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!token) { router.push('/api/auth/login'); return; }

        const api = new ApiClient(token);
        Promise.allSettled([
            api.profile(),
            api.tenants(),
            api.dashboard(),
        ]).then(([profileRes, tenantsRes, dashRes]) => {
            if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
            if (tenantsRes.status  === 'fulfilled') setTenants(tenantsRes.value);
            if (dashRes.status     === 'fulfilled') setDeviceCount(dashRes.value.device_count ?? 0);
        }).finally(() => setLoading(false));
    }, [token, authLoading, router]);

    async function submitRequest(e: React.FormEvent) {
        e.preventDefault();
        if (!orgName.trim() || !token) return;
        setSubmitting(true);
        setReqError(null);
        try {
            await new ApiClient(token).requestTenant({
                org_name: orgName.trim(),
                message:  reqMessage.trim() || undefined,
            });
            setReqSuccess(true);
            setShowRequest(false);
        } catch (err) {
            setReqError((err as { message?: string })?.message ?? 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading || loading) {
        return <div className="mx-auto max-w-2xl px-6 py-8 text-sm text-gray-400">Loading…</div>;
    }

    const role         = profile?.role ?? (authUser as { role?: string } | null)?.role ?? 'user';
    const badge        = ROLE_BADGE[role] ?? ROLE_BADGE.user;
    const displayName  = profile?.name  ?? authUser?.name  ?? '—';
    const displayEmail = profile?.email ?? authUser?.email ?? '—';
    const showTenantRequest = deviceCount > 100;

    return (
        <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <Link href="/my/profile/edit"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Edit Profile
                </Link>
            </div>

            {/* Avatar + name card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                    {displayName[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{displayEmail}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                            {badge.label}
                        </span>
                        {deviceCount > 0 && (
                            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                    { label: 'Full Name',    value: profile?.name             ?? displayName   },
                    { label: 'Email',        value: profile?.email            ?? displayEmail  },
                    { label: 'Phone',        value: profile?.phone            ?? '—'           },
                    { label: 'Timezone',     value: profile?.timezone         ?? '—'           },
                    { label: 'Member since', value: profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '—' },
                ].map(row => (
                    <div key={row.label} className="px-6 py-4 flex items-center justify-between">
                        <p className="text-sm text-gray-500">{row.label}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{row.value}</p>
                    </div>
                ))}
            </div>

            {/* Tenants section */}
            {tenants.length > 0 && (
                <div>
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                        Your Organisations
                    </h2>
                    <div className="space-y-2">
                        {tenants.map(tenant => (
                            <div key={tenant.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
                                {tenant.logo_url ? (
                                    <img src={tenant.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain bg-gray-50 border border-gray-100 shrink-0" />
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {tenant.name[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {tenant.app_name ?? tenant.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{tenant.slug}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`w-1.5 h-1.5 rounded-full ${TENANT_STATUS_DOT[tenant.status] ?? 'bg-gray-400'}`} />
                                    <span className="text-xs text-gray-400 capitalize">{tenant.status}</span>
                                    <a href={tenant.portal_url} target="_blank" rel="noopener noreferrer"
                                        className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                        Open →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tenant request */}
            {showTenantRequest && (
                <div>
                    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-5 py-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                                    Scale up with a Tenant Account
                                </p>
                                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                                    You have {deviceCount} devices. A dedicated tenant account gives you team access, custom branding, and advanced controls.
                                </p>
                            </div>
                        </div>

                        {reqSuccess ? (
                            <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                                ✓ Request submitted — our team will contact you shortly.
                            </div>
                        ) : !showRequest ? (
                            <button onClick={() => setShowRequest(true)}
                                className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                                style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                Request Tenant Account
                            </button>
                        ) : (
                            <form onSubmit={submitRequest} className="mt-4 space-y-3">
                                {reqError && (
                                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                                        {reqError}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                                        Organisation / Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={e => setOrgName(e.target.value)}
                                        required
                                        placeholder="e.g. City Police Department"
                                        className="w-full rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                                        Additional notes (optional)
                                    </label>
                                    <textarea
                                        value={reqMessage}
                                        onChange={e => setReqMessage(e.target.value)}
                                        rows={3}
                                        placeholder="Tell us about your use case, team size, or special requirements…"
                                        className="w-full rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setShowRequest(false)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting || !orgName.trim()}
                                        className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all"
                                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                                        {submitting ? 'Submitting…' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit CTA */}
            <div className="flex justify-end">
                <Link href="/my/profile/edit"
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    Edit Profile
                </Link>
            </div>
        </div>
    );
}
