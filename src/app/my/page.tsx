import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';

export const runtime = 'edge';
export const metadata = { title: 'My Dashboard' };

const PRIORITY_COLORS: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-yellow-100 text-yellow-700',
    low:      'bg-gray-100 text-gray-600',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    confirmed:  'bg-blue-100 text-blue-700',
    shipped:    'bg-indigo-100 text-indigo-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
};

export default async function MyDashboard() {
    const session = await getSession();
    const api     = new ApiClient(session!.token);

    let data: Awaited<ReturnType<typeof api.dashboard>>;
    let apiError: string | null = null;
    try {
        data = await api.dashboard();
    } catch (e) {
        apiError = e instanceof Error ? e.message : String(e);
        data = { device_count: 0, order_count: 0, tenant_count: 0, open_incidents: [] };
    }

    const user = session?.user as { name?: string } | undefined;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome back{user?.name ? `, ${user.name}` : ''}
                </h1>
                <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening across your account.</p>
            </div>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-mono break-all">
                    {apiError}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link href="/my/devices"
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-400 transition-colors group">
                    <p className="text-sm text-gray-500">My Devices</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {data.device_count}
                    </p>
                </Link>

                <Link href="/my/orders"
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-violet-400 transition-colors group">
                    <p className="text-sm text-gray-500">My Orders</p>
                    <p className="mt-1 text-3xl font-bold text-violet-600 group-hover:text-violet-700 transition-colors">
                        {data.order_count}
                    </p>
                </Link>

                <Link href="/my/tenants"
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-400 transition-colors group">
                    <p className="text-sm text-gray-500">Organizations</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                        {data.tenant_count}
                    </p>
                </Link>
            </div>

            {/* Recent incidents (if any) */}
            {data.open_incidents.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Incidents</h2>
                        <Link href="/my/stream" className="text-xs text-blue-600 hover:underline">View live stream</Link>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {data.open_incidents.map((incident) => (
                            <li key={incident.id}
                                className="px-6 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {incident.device?.name ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {incident.event_type} · {new Date(incident.triggered_at).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[incident.priority] ?? ''}`}>
                                    {incident.priority}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Live Stream',  href: '/my/stream',      emoji: '📡' },
                    { label: 'My Devices',   href: '/my/devices',     emoji: '📱' },
                    { label: 'My Orders',    href: '/my/orders',      emoji: '📦' },
                    { label: 'My Profile',   href: '/my/profile',     emoji: '👤' },
                ].map(q => (
                    <Link key={q.href} href={q.href}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center hover:border-blue-300 transition-colors group">
                        <p className="text-2xl mb-1">{q.emoji}</p>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                            {q.label}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
