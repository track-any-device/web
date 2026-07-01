'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { TrendArea, CHART_COLORS } from '@/components/tad/charts';
import { Icon, type IconName } from '@/components/tad/portal-shell';
import { type DashboardData } from '@/lib/portal-data';
import { DashboardSection } from './dashboard-section';

/* Admin Overview — the landing dashboard. Headline totals (full StatRow) + platform-wide
   activity trend, then a row of drill-down cards into the five focused dashboards. Each card
   surfaces ONE headline number from totals (never fabricated) and links to its dashboard page.
   The six cards: Fleet / Operations / Support / Integrations / Customers + a Platform recap. */

interface DrillCard {
  href: string;
  icon: IconName;
  title: string;
  blurb: string;
  /** Headline figure for the card — pulled from real totals. */
  value: (d: DashboardData) => React.ReactNode;
  valueLabel: string;
}

const DRILL_CARDS: DrillCard[] = [
  {
    href: '/admin/dashboards/fleet',
    icon: 'cpu',
    title: 'Fleet',
    blurb: 'Device onboarding & status',
    value: (d) => d.totals.activeDevices,
    valueLabel: 'active devices',
  },
  {
    href: '/admin/dashboards/operations',
    icon: 'alert',
    title: 'Operations',
    blurb: 'Alerts & priority',
    value: (d) => d.totals.openIncidents,
    valueLabel: 'open alerts',
  },
  {
    href: '/admin/dashboards/support',
    icon: 'bell',
    title: 'Support',
    blurb: 'Tickets & status',
    value: (d) => d.totals.openTickets,
    valueLabel: 'open tickets',
  },
  {
    href: '/admin/dashboards/integrations',
    icon: 'message',
    title: 'Integrations & Comms',
    blurb: 'Forwarding & SMS traffic',
    value: (d) => d.totals.forwarded24h,
    valueLabel: 'forwarded 24h',
  },
  {
    href: '/admin/dashboards/customers',
    icon: 'users',
    title: 'Customers',
    blurb: 'Users joined & types',
    value: (d) => d.totals.users,
    valueLabel: 'users',
  },
];

function DrillTile({ card, data }: { card: DrillCard; data: DashboardData }) {
  return (
    <Link href={card.href} className="tad-dash-drill" aria-label={`Open the ${card.title} dashboard`}>
      <Card interactive style={{ height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span className="tad-dash-drill__icon" aria-hidden>
            <Icon name={card.icon} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text)' }}>
              {card.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{card.blurb}</div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {card.value(data)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.valueLabel}</span>
        </div>
      </Card>
    </Link>
  );
}

export function OverviewCharts({ initial, initialDays }: { initial: DashboardData; initialDays: number }) {
  return (
    <DashboardSection
      initial={initial}
      initialDays={initialDays}
      stats={(d) => [
        { label: 'Users', value: d.totals.users },
        { label: 'Active devices', value: d.totals.activeDevices, hint: `${d.totals.devices} total · ${d.totals.pendingDevices} pending` },
        { label: 'Organisations', value: d.totals.organisations },
        { label: 'Open alerts', value: d.totals.openIncidents },
        { label: 'Open tickets', value: d.totals.openTickets },
        { label: 'Forwarded 24h', value: d.totals.forwarded24h },
        { label: 'SMS sent 24h', value: d.totals.smsSent24h },
        { label: 'SMS received 24h', value: d.totals.smsReceived24h },
      ]}
      emptyTitle="No activity data yet"
      emptyBody="Once the platform records users, devices, alerts and signal traffic, the trends and breakdowns will appear here."
    >
      {(d) => (
        <>
          <Card title="Platform activity" className="tad-charts-grid__full">
            <TrendArea data={d.timeseries.activity} name="Events" color={CHART_COLORS.brand} />
          </Card>

          <div className="tad-charts-grid__full">
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 'var(--space-3)' }}>
              Dashboards
            </div>
            <div className="tad-dash-drill-grid">
              {DRILL_CARDS.map((card) => (
                <DrillTile key={card.href} card={card} data={d} />
              ))}
              {/* Sixth tile: a platform recap that stays on the Overview. */}
              <Card style={{ height: '100%', background: 'var(--brand-subtle)', borderColor: 'var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span className="tad-dash-drill__icon" aria-hidden>
                    <Icon name="grid" />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text)' }}>
                      Platform
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Totals across every area</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {d.totals.devices}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>devices total</span>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </DashboardSection>
  );
}
