import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type DeliveryOrder } from '@/lib/portal-data';
import { OrderAction } from './order-action';

const STATUS: Record<string, 'warning' | 'brand' | 'outline' | 'success' | 'neutral'> = { pending: 'warning', confirmed: 'brand', shipped: 'outline', delivered: 'success', cancelled: 'neutral' };

export default async function OrdersPage() {
  await requirePortal('orders');
  const { data: rows, error } = await fetchPortal<DeliveryOrder>('/ops/orders');
  return (
    <>
      <PortalTopbar title="Orders — Delivery board" subtitle="Confirm, ship, and deliver — cash on delivery, PKR" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Pending', value: rows.filter((o) => o.status === 'pending').length },
          { label: 'Confirmed', value: rows.filter((o) => o.status === 'confirmed').length },
          { label: 'Shipped', value: rows.filter((o) => o.status === 'shipped').length },
          { label: 'Delivered', value: rows.filter((o) => o.status === 'delivered').length },
        ]} />
        <DataTable<DeliveryOrder>
          empty={error ?? 'No delivery orders yet.'}
          rows={rows}
          columns={[
            { key: 'id', header: 'Order', mono: true },
            { key: 'customer', header: 'Customer', render: (r) => r.customer ?? '—' },
            { key: 'phone', header: 'Phone', mono: true, render: (r) => r.phone ?? '—' },
            { key: 'items', header: 'Devices', align: 'center' },
            { key: 'total', header: 'Total', align: 'right', mono: true, render: (r) => r.total != null ? `${r.currency ?? 'PKR'} ${Number(r.total).toLocaleString()}` : '—' },
            {
              key: 'status', header: 'Status', render: (r) => (
                <div style={{ display: 'grid', gap: 2 }}>
                  <Badge variant={STATUS[r.status ?? ''] ?? 'neutral'}>{r.status ?? '—'}</Badge>
                  {r.status === 'shipped' && r.tracking && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {[r.tracking.courier, r.tracking.number].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {r.status === 'cancelled' && r.cancellationReason && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }} title={r.cancellationReason}>{r.cancellationReason}</span>
                  )}
                </div>
              ),
            },
            { key: 'act', header: '', align: 'right', render: (r) => <OrderAction orderId={r.orderId} status={r.status ?? null} /> },
          ]}
        />
      </div>
    </>
  );
}
