import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { Metadata } from 'next';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Beats' };

const STATUS_BADGE: Record<string, string> = {
    active:   'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-500',
    draft:    'bg-yellow-100 text-yellow-700',
};

export default async function MyBeatsPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');
    const api = new ApiClient(session.token);

    let beats: Awaited<ReturnType<typeof api.beats>>['data'] = [];
    let apiError: string | null = null;
    try {
        const res = await api.beats();
        beats = res.data;
    } catch (e) {
        apiError = e instanceof Error ? e.message : String(e);
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Beats</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Personal geofence zones for your devices.</p>
                </div>
                <Link href="/my/beats/create"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                    + New Beat
                </Link>
            </div>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-mono break-all">
                    {apiError}
                </div>
            )}

            {beats.length === 0 ? (
                <div className="text-center py-24 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-4xl mb-3">📍</p>
                    <p className="text-base font-medium text-gray-400">No beats yet</p>
                    <p className="text-sm text-gray-500 mt-1 mb-6">
                        Create a geofence zone to track when your devices enter or leave an area.
                    </p>
                    <Link href="/my/beats/create"
                        className="inline-block px-5 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                        Create your first beat
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {beats.map(beat => (
                        <Link key={beat.id} href={`/my/beats/${beat.id}`}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-400 transition-colors group">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {beat.name}
                                </h3>
                                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[beat.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {beat.status}
                                </span>
                            </div>
                            {beat.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{beat.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span className="capitalize">{beat.geo_fence_type}</span>
                                <span>·</span>
                                <span>{new Date(beat.created_at).toLocaleDateString()}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
