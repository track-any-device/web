'use client';

import React from 'react';
import { Card, Tabs } from '@/components/ui';
import { StatRow } from '@/components/tad/data-table';
import { TrendArea, MultiTrend, Donut, CHART_COLORS } from '@/components/tad/charts';
import { type DashboardData, isDashboardEmpty, emptyDashboard } from '@/lib/portal-data';

/* Client wrapper for the admin dashboard. Seeds from the server-fetched payload for fast
   first paint, then refetches the BFF (/api/admin/dashboard?days=N) when the range toggles.
   Real data only — when the payload is the empty fallback we show ONE friendly empty state
   rather than a wall of flat charts (in dev we also surface the underlying reason). */

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

const DEV = process.env.NODE_ENV !== 'production';

export function DashboardCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  const [days, setDays] = React.useState(initialDays);
  const [data, setData] = React.useState<DashboardData>(initial);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onRange = React.useCallback(
    async (next: number) => {
      if (next === days) return;
      setDays(next);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/dashboard?days=${next}`, { headers: { Accept: 'application/json' } });
        if (!res.ok) {
          setData(emptyDashboard(next));
          setError(DEV ? `Dashboard API responded ${res.status}.` : null);
          return;
        }
        const body = (await res.json()) as DashboardData;
        setData(body);
      } catch (e) {
        setData(emptyDashboard(next));
        setError(DEV ? `Dashboard request failed: ${(e as Error).message}` : null);
      } finally {
        setLoading(false);
      }
    },
    [days],
  );

  const empty = isDashboardEmpty(data);
  const { totals, timeseries, distributions } = data;

  const rangeToggle = (
    <Tabs
      variant="pill"
      items={RANGES}
      value={String(days)}
      onChange={(v) => onRange(Number(v))}
    />
  );

  return (
    <div className="tad-portal__body">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {data.range.from && data.range.to ? `${data.range.from} → ${data.range.to} (UTC)` : `Last ${days} days`}
          {loading && <span style={{ marginLeft: 8 }}>· updating…</span>}
        </div>
        {rangeToggle}
      </div>

      <StatRow
        stats={[
          { label: 'Users', value: totals.users },
          { label: 'Active devices', value: totals.activeDevices, hint: `${totals.devices} total · ${totals.pendingDevices} pending` },
          { label: 'Organisations', value: totals.organisations },
          { label: 'Open incidents', value: totals.openIncidents },
          { label: 'Open tickets', value: totals.openTickets },
          { label: 'Forwarded 24h', value: totals.forwarded24h },
          { label: 'SMS sent 24h', value: totals.smsSent24h },
          { label: 'SMS received 24h', value: totals.smsReceived24h },
        ]}
      />

      {empty ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)', display: 'grid', gap: 8, justifyItems: 'center' }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text)' }}>No activity data yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420 }}>
              Once the platform records users, devices, incidents and signal traffic, the trends and
              breakdowns will appear here.
            </div>
            {DEV && error && (
              <div style={{ fontSize: 12, color: 'var(--danger)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{error}</div>
            )}
          </div>
        </Card>
      ) : (
        <div className="tad-charts-grid">
          {/* Wide / full row */}
          <Card title="Platform activity" className="tad-charts-grid__full">
            <TrendArea data={timeseries.activity} name="Events" color={CHART_COLORS.brand} />
          </Card>

          <Card title="Signals forwarded">
            <MultiTrend
              data={timeseries.forwarding as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'delivered', label: 'Delivered', color: CHART_COLORS.ok },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.danger },
              ]}
              variant="area"
              stacked
            />
          </Card>
          <Card title="Users joined">
            <TrendArea data={timeseries.usersJoined} name="Joined" color={CHART_COLORS.blue} />
          </Card>

          <Card title="User types">
            <Donut data={distributions.userTypes.map((d) => ({ label: d.label, count: d.count }))} centerLabel="users" />
          </Card>
          <Card title="Incidents">
            <MultiTrend
              data={timeseries.incidents as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'opened', label: 'Opened', color: CHART_COLORS.danger },
                { key: 'resolved', label: 'Resolved', color: CHART_COLORS.ok },
              ]}
              variant="area"
            />
          </Card>
          <Card title="Incident priority">
            <Donut
              data={distributions.incidentPriority.map((d) => ({ label: d.label, count: d.count }))}
              centerLabel="incidents"
            />
          </Card>

          <Card title="Support tickets">
            <TrendArea data={timeseries.tickets} name="Tickets" color={CHART_COLORS.violet} />
          </Card>
          <Card title="Ticket status">
            <Donut data={distributions.ticketStatus.map((d) => ({ label: d.label, count: d.count }))} centerLabel="tickets" />
          </Card>

          <Card title="Devices onboarded">
            <TrendArea data={timeseries.devicesOnboarded} name="Onboarded" color={CHART_COLORS.brand} />
          </Card>
          <Card title="Device status">
            <Donut data={distributions.deviceStatus.map((d) => ({ label: d.label, count: d.count }))} centerLabel="devices" />
          </Card>

          <Card title="SMS sent">
            <MultiTrend
              data={timeseries.smsOutgoing as unknown as Array<Record<string, string | number>>}
              series={[
                { key: 'sent', label: 'Sent', color: CHART_COLORS.ok },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.danger },
                { key: 'pending', label: 'Pending', color: CHART_COLORS.warn },
              ]}
              variant="bar"
              stacked
            />
          </Card>
          <Card title="SMS received">
            <TrendArea data={timeseries.smsIncoming} name="Received" color={CHART_COLORS.blue} />
          </Card>
        </div>
      )}
    </div>
  );
}
