'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Plug, Radio } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient } from '@/lib/api-client';
import type { Order } from '@/lib/api-client';

const STATUS_BADGE: Record<string, { background: string; color: string }> = {
    pending:    { background: 'var(--warning-bg)', color: 'var(--warning)' },
    confirmed:  { background: 'var(--brand-subtle)', color: 'var(--brand-on-subtle)' },
    shipped:    { background: 'var(--accent-subtle)', color: 'var(--accent)' },
    delivered:  { background: 'var(--success-bg)', color: 'var(--success)' },
    cancelled:  { background: 'var(--danger-bg)', color: 'var(--danger)' },
};

const STATUS_DOT: Record<string, string> = {
    pending:   'var(--warning)',
    confirmed: 'var(--brand)',
    shipped:   'var(--accent)',
    delivered: 'var(--success)',
    cancelled: 'var(--danger)',
};

const STATUS_LABEL: Record<string, string> = {
    pending:   'Pending',
    confirmed: 'Confirmed',
    shipped:   'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

export default function OrdersClient() {
    const { token } = useAuth();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status') ?? '';

    const [orders, setOrders] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        const api = new ApiClient(token);
        api.orders(statusFilter ? { status: statusFilter } : undefined)
            .then((result) => {
                setOrders(result.data);
                setTotal(result.total);
            })
            .catch(() => {
                setOrders([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [token, statusFilter]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    if (loading) return null; // the portal LoadingProvider overlay covers this area

    return (
        <div className="mx-auto max-w-5xl p-4 space-y-6 sm:p-6 lg:p-8">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                    My orders
                    <span className="ml-2" style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-regular)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>({total})</span>
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
                            className={`tad-btn tad-btn--sm ${statusFilter === status ? 'tad-btn--primary' : 'tad-btn--secondary'}`}>
                            {label}
                        </a>
                    ))}
                </div>
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 gap-2 rounded-xl"
                    style={{ border: '1px dashed var(--border-strong)' }}>
                    <Package className="w-9 h-9" style={{ color: 'var(--text-subtle)' }} />
                    <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>No orders yet</p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                        Visit the{' '}
                        <a href="/shop" style={{ color: 'var(--brand)', fontWeight: 'var(--weight-medium)' }}>shop</a>
                        {' '}to browse available devices and accessories.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id}
                            className="rounded-xl overflow-hidden"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

                            {/* Order header */}
                            <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
                                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <div className="flex items-center gap-3">
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                        #{order.order_number}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full"
                                        style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--weight-semibold)', ...(STATUS_BADGE[order.status] ?? { background: 'var(--surface-sunken)', color: 'var(--text-secondary)' }) }}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[order.status] ?? 'var(--text-muted)' }} />
                                        {STATUS_LABEL[order.status] ?? order.status}
                                    </span>
                                    {order.tracking_number && (
                                        <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                            Tracking: {order.tracking_number}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    {order.total_usd != null && (
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--brand)' }}>${order.total_usd.toFixed(2)}</span>
                                    )}
                                    {order.total_pkr != null && (
                                        <span style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PKR {order.total_pkr.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>

                            {/* Order items */}
                            {order.items?.length > 0 && (
                                <ul>
                                    {order.items.map((item, idx) => (
                                        <li key={item.id} className="px-5 py-3 flex items-center justify-between"
                                            style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                                                    {item.product_type === 'accessory'
                                                        ? <Plug className="w-4 h-4" />
                                                        : <Radio className="w-4 h-4" />}
                                                </span>
                                                <div>
                                                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{item.product_name}</p>
                                                    <p className="capitalize" style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{item.product_type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</p>
                                                {item.unit_price_usd != null && (
                                                    <p style={{ fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>${item.unit_price_usd} each</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Order footer */}
                            <div className="px-5 py-2.5 flex items-center gap-4 flex-wrap"
                                style={{ background: 'var(--surface-sunken)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>Placed {new Date(order.created_at).toLocaleDateString()}</span>
                                {order.shipped_at && (
                                    <span style={{ fontFamily: 'var(--font-mono)' }}>Shipped {new Date(order.shipped_at).toLocaleDateString()}</span>
                                )}
                                {order.delivered_at && (
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'var(--weight-medium)', color: 'var(--success)' }}>
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
