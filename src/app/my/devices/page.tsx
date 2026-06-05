import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';

export const runtime = 'edge';

export const metadata = { title: 'My Devices' };

const STATUS_BADGE: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    inactive:  'bg-gray-100 text-gray-600',
    offline:   'bg-red-100 text-red-700',
    inventory: 'bg-blue-100 text-blue-700',
};

export default async function MyDevicesPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/signin/sso');
    const api = new ApiClient(session.token);

    let devices: Awaited<ReturnType<typeof api.devices>>['data'] = [];
    let total = 0;
    let apiError: string | null = null;
    try {
        const result = await api.devices();
        devices = result.data;
        total   = result.total;
    } catch (e) {
        apiError = e instanceof Error ? e.message : String(e);
    }

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Devices ({total})</h1>

            {apiError && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-mono break-all">
                    {apiError}
                </div>
            )}

            {!apiError && devices.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-3">📡</p>
                    <p className="text-lg font-medium">No devices yet</p>
                    <p className="text-sm mt-1">Devices you own or are assigned to you will appear here.</p>
                    <a href="/shop"
                        className="inline-block mt-5 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                        Browse Shop
                    </a>
                </div>
            )}

            {!apiError && devices.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {devices.map((device) => (
                        <Link key={device.id} href={`/my/devices/${device.id}`}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 transition-colors group">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                        {device.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{device.imei}</p>
                                </div>
                                <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[device.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                    {device.status}
                                </span>
                            </div>

                            {device.device_type && (
                                <p className="mt-3 text-xs text-gray-500">{device.device_type.name}</p>
                            )}

                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                {device.battery_percent != null && (
                                    <span className={device.battery_percent < 20 ? 'text-red-600 font-medium' : ''}>
                                        🔋 {device.battery_percent}%
                                    </span>
                                )}
                                {device.last_signal_at && (
                                    <span>{new Date(device.last_signal_at).toLocaleDateString()}</span>
                                )}
                                {device.tenant && (
                                    <span className="ml-auto text-blue-600">{device.tenant.name}</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
