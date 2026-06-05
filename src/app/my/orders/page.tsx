import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import type { Metadata } from 'next';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Orders' };

const STATUS_BADGE: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    confirmed:  'bg-blue-100 text-blue-700',
    shipped:    'bg-indigo-100 text-indigo-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    shipped:   'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

export default async function MyOrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; page?: string }>;
}) {
    const params  = await searchParams;
    const session = await getSession();
    if (!session) redirect('/api/auth/login');
    const api = new ApiClient(session.token);

    let orders: Awaited<ReturnType<typeof api.orders>>['data'] = [];
    let total = 0;
    try {
        const result = await api.orders(
            params.status ? { status: params.status } : undefined,
        );
        orders = result.data;
        total  = result.total;
    } catch {}

    return (
        <div className="p-8 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Orders ({total})
                </h1>
                {/* Status filter */}
                <div className="flex flex-wrap gap-2">
                    {[
                        ['All',       ''          ],
                        ['Pending',   'pending'   ],
                        ['Shipped',   'shipped'   ],
                        ['Delivered', 'delivered' ],
                        ['Cancelled', 'cancelled' ],
                    ].map(([label, status]) => (
                        <a key={label}
                            href={status ? `/my/orders?status=${status}` : '/my/orders'}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                (params.status ?? '') === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                            }`}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
                <div className="text-center py-24 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-4xl mb-3">📦</p>
                    <p className="text-base font-medium text-gray-400">No orders yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Visit the{' '}
                        <a href="/shop" className="text-blue-600 hover:underline">Shop</a>
                        {' '}to browse available devices and accessories.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                            {/* Order header */}
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                                        #{order.order_number}
                                    </span>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {STATUS_LABEL[order.status] ?? order.status}
                                    </span>
                                    {order.tracking_number && (
                                        <span className="text-xs text-gray-400 font-mono">
                                            Tracking: {order.tracking_number}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    {order.total_usd != null && (
                                        <span className="font-bold text-blue-600">${order.total_usd.toFixed(2)}</span>
                                    )}
                                    {order.total_pkr != null && (
                                        <span className="text-gray-400 text-xs">PKR {order.total_pkr.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Order items */}
                            {order.items?.length > 0 && (
                                <ul className="divide-y divide-gray-50 dark:divide-gray-750">
                                    {order.items.map(item => (
                                        <li key={item.id} className="px-5 py-3 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{item.product_type === 'accessory' ? '🔌' : '📡'}</span>
                                                <div>
                                                    <p className="text-gray-800 dark:text-gray-200 font-medium">{item.product_name}</p>
                                                    <p className="text-xs text-gray-400 capitalize">{item.product_type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-600 dark:text-gray-400 text-xs">Qty: {item.quantity}</p>
                                                {item.unit_price_usd != null && (
                                                    <p className="text-gray-500 text-xs">${item.unit_price_usd} each</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Order footer */}
                            <div className="px-5 py-2.5 bg-gray-50 dark:bg-gray-900 flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                                <span>Placed {new Date(order.created_at).toLocaleDateString()}</span>
                                {order.shipped_at && (
                                    <span>Shipped {new Date(order.shipped_at).toLocaleDateString()}</span>
                                )}
                                {order.delivered_at && (
                                    <span className="text-green-600 font-medium">
                                        Delivered {new Date(order.delivered_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
