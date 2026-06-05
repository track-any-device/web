import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import type { Metadata } from 'next';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Profile' };

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    admin:       { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Admin'       },
    tenant_user: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Tenant User' },
    user:        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'User'        },
};

export default async function MyProfilePage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');
    const api = new ApiClient(session.token);

    let profile: Awaited<ReturnType<typeof api.profile>> | null = null;
    try {
        profile = await api.profile();
    } catch {}

    const sessionUser = session?.user as { name?: string; email?: string; role?: string } | undefined;
    const role        = profile?.role ?? sessionUser?.role ?? 'user';
    const badge       = ROLE_BADGE[role] ?? ROLE_BADGE.user;

    return (
        <div className="p-8 max-w-2xl space-y-6">

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
                    {(profile?.name ?? sessionUser?.name ?? 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                        {profile?.name ?? sessionUser?.name ?? '—'}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                        {profile?.email ?? sessionUser?.email ?? '—'}
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
                        { label: 'Full Name',  value: profile.name             },
                        { label: 'Email',      value: profile.email            },
                        { label: 'Phone',      value: profile.phone ?? '—'     },
                        { label: 'Timezone',   value: profile.timezone ?? '—'  },
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
                        { label: 'Full Name',  value: sessionUser?.name  ?? '—' },
                        { label: 'Email',      value: sessionUser?.email ?? '—' },
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
