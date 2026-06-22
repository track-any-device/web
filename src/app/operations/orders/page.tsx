import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { DataTable, StatRow } from '@/components/tad/data-table';
import { Badge, Button } from '@/components/ui';
import { ORDERS, type DeliveryOrder } from '@/lib/portal-data';

const STATUS: Record<DeliveryOrder['status'], 'warning' | 'brand' | 'success'> = {
  packing: 'warning', dispatched: 'brand', delivered: 'success',
};
const NEXT: Record<DeliveryOrder['status'], string | null> = {
  packing: 'Mark dispatched', dispatched: 'Mark delivered', delivered: null,
};

export default function OrdersPage() {
  return (
    <>
      <PortalTopbar title="Orders — Delivery board" subtitle="Pack, dispatch, and deliver — cash on delivery, PKR" />
      <div className="tad-portal__body">
        <StatRow stats={[
          { label: 'Packing', value: ORDERS.filter((o) => o.status === 'packing').length },
          { label: 'Dispatched', value: ORDERS.filter((o) => o.status === 'dispatched').length },
          { label: 'Delivered', value: ORDERS.filter((o) => o.status === 'delivered').length },
        ]} />
        <DataTable<DeliveryOrder>
          rows={ORDERS}
          columns={[
            { key: 'id', header: 'Order', mono: true },
            { key: 'customer', header: 'Customer' },
            { key: 'phone', header: 'Phone', mono: true },
            { key: 'city', header: 'City' },
            { key: 'items', header: 'Devices', align: 'center' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS[r.status]}>{r.status}</Badge> },
            {
              key: 'act', header: '', align: 'right', render: (r) =>
                NEXT[r.status] ? <Button variant="secondary" size="sm">{NEXT[r.status]}</Button> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Done</span>,
            },
          ]}
        />
      </div>
    </>
  );
}
