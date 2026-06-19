'use client';
import React from 'react';
import { Tabs, Card, Metric, Badge, StatusDot, Input, Select, Switch, Button } from '@/components/ui';

/* Internal operations portals (preview): Procurement / Workshop / Delivery Orders.
   Role-gated in production (Role::Procurement | Workshop | DeliveryOrder). Placeholder data. */

const ROLES = [
  { value: 'procurement', label: 'Procurement' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'delivery', label: 'Delivery Orders' },
];

type Incoming = { imei: string; model: string; sim?: string; order?: string; status: 'pending' | 'configured' | 'dispatched' };
const INCOMING: Incoming[] = [
  { imei: '356938035643809', model: 'Concox GT06N', sim: '0301-2233445', order: 'DO-1029', status: 'configured' },
  { imei: '356938035643810', model: 'Wanwaytech G18', status: 'pending' },
  { imei: '356938035643811', model: 'Concox VL103', sim: '0302-9988776', status: 'configured' },
];

type Order = { id: string; customer: string; items: number; status: 'packing' | 'dispatched' | 'delivered' };
const ORDERS: Order[] = [
  { id: 'DO-1029', customer: 'Ali Raza', items: 2, status: 'dispatched' },
  { id: 'DO-1030', customer: 'Sana Khan', items: 1, status: 'packing' },
  { id: 'DO-1028', customer: 'Bilal Ahmed', items: 3, status: 'delivered' },
];

const STATUS_VARIANT = { pending: 'warning', configured: 'success', dispatched: 'brand', packing: 'warning', delivered: 'success' } as const;

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)' }}>{children}</div>;
}

function Procurement() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <Card title="Register incoming device">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 'var(--space-3)', alignItems: 'end' }}>
          <Input label="Add device — scan or type IMEI" mono placeholder="3569 3803 5643 8xx" />
          <Select label="Model" options={['Concox GT06N', 'Wanwaytech G18', 'Concox VL103', 'P901']} />
          <Button>Add device</Button>
        </div>
      </Card>
      <Card title="Incoming devices" flushBody>
        <div style={{ padding: '0 var(--space-5) var(--space-3)' }}>
          {INCOMING.map((d) => (
            <Row key={d.imei}>
              <span className="tad-data" style={{ flex: 2 }}>{d.imei}</span>
              <span style={{ flex: 2 }}>{d.model}</span>
              <span className="tad-data" style={{ flex: 1, color: 'var(--text-muted)' }}>{d.sim || '— no SIM —'}</span>
              <Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge>
            </Row>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Workshop() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(280px, 1.3fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
      <Card title="Config queue" flushBody>
        <div style={{ padding: '0 var(--space-5) var(--space-3)' }}>
          {INCOMING.filter((d) => d.status === 'pending').concat(INCOMING.filter((d) => d.status !== 'pending')).map((d) => (
            <Row key={d.imei}>
              <span className="tad-data" style={{ flex: 1 }}>{d.imei.slice(-6)}</span>
              <span style={{ flex: 1 }}>{d.model}</span>
              <StatusDot status={d.status === 'pending' ? 'offline' : 'moving'} label={d.status === 'pending' ? 'Needs config' : 'Configured'} />
            </Row>
          ))}
        </div>
      </Card>
      <Card title="Configure device" footer={<Button block>Mark configured</Button>}>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <Input label="SIM number" mono placeholder="0301-2233445" />
          <Input label="APN &amp; server endpoint" placeholder="zonggprs · jt.tad-pak.pk:7018" />
          <Switch label="Engine cut-off relay fitted" />
          <Switch label="Geofence + over-speed defaults" defaultChecked />
          <Select label="Report interval" options={['10s', '30s', '60s']} />
          <Switch label="SMS commands enabled" defaultChecked />
        </div>
      </Card>
    </div>
  );
}

function Delivery() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {ORDERS.map((o) => (
        <Card key={o.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--surface-sunken)', display: 'grid', placeItems: 'center', color: 'var(--text-subtle)', fontSize: 'var(--text-2xs)' }}>QR</div>
            <div style={{ flex: 1 }}>
              <div className="tad-data" style={{ fontWeight: 600 }}>{o.id}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{o.customer} · {o.items} device{o.items > 1 ? 's' : ''}</div>
            </div>
            <Badge variant={STATUS_VARIANT[o.status]}>{o.status}</Badge>
            {o.status !== 'delivered' && <Button variant="secondary" size="sm">{o.status === 'packing' ? 'Mark dispatched' : 'Mark delivered'}</Button>}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function OperationsClient() {
  const [role, setRole] = React.useState('procurement');
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-10)', flexWrap: 'wrap' }}>
        <Metric label="Incoming" value={INCOMING.length} />
        <Metric label="Awaiting config" value={INCOMING.filter((d) => d.status === 'pending').length} />
        <Metric label="Open orders" value={ORDERS.filter((o) => o.status !== 'delivered').length} />
      </div>
      <Tabs variant="pill" value={role} onChange={setRole} items={ROLES} />
      {role === 'procurement' ? <Procurement /> : role === 'workshop' ? <Workshop /> : <Delivery />}
    </div>
  );
}
