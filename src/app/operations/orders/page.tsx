import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { fetchPortal } from '@/lib/admin-api';
import { ORDERS, type DeliveryOrder } from '@/lib/portal-data';

const STATUS: Record<string, 'warning' | 'brand' | 'success' | 'neutral'> = { pending: 'warning', confirmed: 'brand', delivered: 'success', cancelled: 'neutral' };
const NEXT: Record<string, string | null> = { pending: 'Confirm', confirmed: 'Mark delivered', delivered: null, cancelled: null };

export default async function OrdersPage() {
  const rows = await fetchPortal<DeliveryOrder[]>('/ops/orders', ORDERS);
  return (
    <>
      <PortalTopbar title="Orders — Delivery board" subtitle="Confirm, dispatch, and deliver — cash on delivery, PKR" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Pending', value: rows.filter((o) => o.status === 'pending').length },
          { label: 'Confirmed', value: rows.filter((o) => o.status === 'confirmed').length },
          { label: 'Delivered', value: rows.filter((o) => o.status === 'delivered').length },
        ]} />
        <DataTable<DeliveryOrder>
          rows={rows}
          columns={[
            { key: 'id', header: 'Order', mono: true },
            { key: 'customer', header: 'Customer', render: (r) => r.customer ?? '—' },
            { key: 'phone', header: 'Phone', mono: true, render: (r) => r.phone ?? '—' },
            { key: 'items', header: 'Devices', align: 'center' },
            { key: 'total', header: 'Total', align: 'right', mono: true, render: (r) => r.total != null ? `${r.currency ?? 'PKR'} ${Number(r.total).toLocaleString()}` : '—' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status ?? ''] ?? 'neutral'}>{r.status ?? '—'}</Badge> },
            { key: 'act', header: '', align: 'right', render: (r) => NEXT[r.status ?? ''] ? <Button variant="secondary" size="sm">{NEXT[r.status ?? '']}</Button> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span> },
          ]}
        />
      </div>
    </>
  );
}
