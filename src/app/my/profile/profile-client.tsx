'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient, type UserProfile } from '@/lib/api-client';

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    admin:       { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Admin'       },
    tenant_user: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Tenant User' },
    user:        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'User'        },
};

export default function ProfileClient() {
    const { token, user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!token) { router.push('/api/auth/login'); return; }

        const api = new ApiClient(token);
        api.profile()
            .then(setProfile)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token, authLoading, router]);

    if (authLoading || loading) {
        return <div className="mx-auto max-w-2xl px-6 py-8 text-sm text-gray-400">Loading…</div>;
    }

    const role  = profile?.role ?? (authUser as { role?: string } | null)?.role ?? 'user';
    const badge = ROLE_BADGE[role] ?? ROLE_BADGE.user;

    const displayName  = profile?.name  ?? authUser?.name  ?? '—';
    const displayEmail = profile?.email ?? authUser?.email ?? '—';

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
                    {displayName[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                        {displayName}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                        {displayEmail}
                    </p>
                    <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                    </span>
                </div>
            </div>

            {/* Details */}
            {profile ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                        { label: 'Full Name',    value: profile.name             },
                        { label: 'Email',        value: profile.email            },
                        { label: 'Phone',        value: profile.phone ?? '—'     },
                        { label: 'Timezone',     value: profile.timezone ?? '—'  },
                        { label: 'Member since', value: new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    ].map(row => (
                        <div key={row.label} className="px-6 py-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">{row.label}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.value}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                        { label: 'Full Name', value: displayName  },
                        { label: 'Email',     value: displayEmail },
                    ].map(row => (
                        <div key={row.label} className="px-6 py-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">{row.label}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.value}</p>
                        </div>
                    ))}
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
