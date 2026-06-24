'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/* TAD-PAK themed recharts wrappers — small + presentational.
   Tokens (resolved hex so SVG strokes/fills render reliably inside recharts):
     primary  = var(--brand)   Pakistan green #01411C
     delivered/ok = var(--success) green     #1F9462
     pending/warn = var(--warning) amber      #D9870A
     failed/danger = var(--danger) red        #F0463C
   Per-transport feed palette reused from forwarding-activity.tsx:
     rest_api = #2563EB (blue), mqtt = #7C3AED (violet), tad101 = brand green.
   Axis ticks + tooltip numbers use DM Mono (var(--font-mono)). */

export const CHART_COLORS = {
  brand: '#01411C', // var(--brand) — Pakistan green (primary series)
  ok: '#1F9462', // var(--success) — delivered / sent / resolved
  warn: '#D9870A', // var(--warning) — pending
  danger: '#F0463C', // var(--danger) — failed
  blue: '#2563EB', // forwarding rest_api accent
  violet: '#7C3AED', // forwarding mqtt accent
} as const;

/* Donut palette — distinct, on-brand hues cycled for distribution slices. */
const DONUT_PALETTE = [
  CHART_COLORS.brand,
  CHART_COLORS.ok,
  CHART_COLORS.blue,
  CHART_COLORS.warn,
  CHART_COLORS.violet,
  CHART_COLORS.danger,
  '#2E8455', // pak-400 — lighter green
];

const MONO = 'var(--font-mono)';
const AXIS_TICK = { fontSize: 11, fontFamily: MONO, fill: 'var(--text-muted)' } as const;
const GRID_STROKE = 'var(--border-subtle)';

/* Short, dependable axis labels for "YYYY-MM-DD" dates (e.g. "24 Jun"). */
function shortDate(value: string): string {
  if (!value || typeof value !== 'string') return String(value ?? '');
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]}`;
}

/* Warm, design-system tooltip shared across all charts. */
function TadTooltip({
  active,
  payload,
  label,
  labelMap,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>;
  label?: string | number;
  labelMap?: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const heading = typeof label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(label) ? shortDate(label) : label;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.10))',
        padding: '8px 12px',
        fontFamily: 'var(--font-body)',
      }}
    >
      {heading != null && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{heading}</div>
      )}
      <div style={{ display: 'grid', gap: 4 }}>
        {payload.map((p, i) => {
          const key = String(p.dataKey ?? p.name ?? i);
          const name = labelMap?.[key] ?? p.name ?? key;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flex: 'none' }} aria-hidden />
              <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>
                {p.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendAreaProps {
  data: TrendPoint[];
  /** Stroke/fill colour for the area. Defaults to brand green. */
  color?: string;
  /** Accessible series name (used in the tooltip). */
  name?: string;
  height?: number;
}

/* Single-series area chart over { date, count }. */
export function TrendArea({ data, color = CHART_COLORS.brand, name = 'Count', height = 220 }: TrendAreaProps) {
  const gid = React.useId().replace(/:/g, '');
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id={`tad-area-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
          minTickGap={24}
        />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={38} />
        <Tooltip content={<TadTooltip labelMap={{ count: name }} />} cursor={{ stroke: color, strokeOpacity: 0.25 }} />
        <Area
          type="monotone"
          dataKey="count"
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={`url(#tad-area-${gid})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface MultiSeries {
  /** Key in each data row (e.g. "delivered"). */
  key: string;
  /** Human label for legend + tooltip. */
  label: string;
  color: string;
}

export interface MultiTrendProps {
  data: Array<Record<string, string | number>>;
  series: MultiSeries[];
  /** "area" (stacked) or "bar" (grouped/stacked). */
  variant?: 'area' | 'bar';
  /** Stack the series on top of each other. */
  stacked?: boolean;
  height?: number;
}

/* Multi-key time-series (forwarding / incidents / smsOutgoing). */
export function MultiTrend({ data, series, variant = 'area', stacked = false, height = 220 }: MultiTrendProps) {
  const gid = React.useId().replace(/:/g, '');
  const labelMap = Object.fromEntries(series.map((s) => [s.key, s.label]));
  const stackId = stacked ? 'tad-stack' : undefined;

  if (variant === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="22%">
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            minTickGap={24}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={38} />
          <Tooltip
            content={<TadTooltip labelMap={labelMap} />}
            cursor={{ fill: 'var(--surface-hover)', fillOpacity: 0.5 }}
          />
          <Legend
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', paddingTop: 8 }}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              stackId={stackId}
              radius={stacked && i < series.length - 1 ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={26}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`tad-m-${gid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.26} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDate}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
          minTickGap={24}
        />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={38} />
        <Tooltip content={<TadTooltip labelMap={labelMap} />} cursor={{ stroke: 'var(--border-strong)', strokeOpacity: 0.4 }} />
        <Legend
          iconType="circle"
          iconSize={9}
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', paddingTop: 8 }}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stackId={stackId}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#tad-m-${gid}-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface DonutSlice {
  label: string;
  count: number;
  /** Optional explicit colour; otherwise cycles the donut palette. */
  color?: string;
}

export interface DonutProps {
  data: DonutSlice[];
  height?: number;
  /** Caption under the centre total (e.g. "users"). */
  centerLabel?: string;
}

/* Distribution donut with a legend + centre total. Hides zero-count slices from
   the ring but keeps them in the legend so every enum case stays visible. */
export function Donut({ data, height = 220, centerLabel }: DonutProps) {
  const total = data.reduce((sum, d) => sum + (d.count || 0), 0);
  const colored = data.map((d, i) => ({ ...d, color: d.color ?? DONUT_PALETTE[i % DONUT_PALETTE.length] }));
  const ringData = colored.filter((d) => d.count > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={ringData.length ? ringData : [{ label: 'none', count: 1, color: 'var(--border)' }]}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={ringData.length > 1 ? 2 : 0}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive
            >
              {(ringData.length ? ringData : [{ color: 'var(--border)' }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            {ringData.length > 0 && <Tooltip content={<TadTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 26, color: 'var(--text)', lineHeight: 1 }}>
            {total}
          </span>
          {centerLabel && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{centerLabel}</span>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 14px',
          marginTop: 10,
          justifyContent: 'center',
        }}
      >
        {colored.map((d) => (
          <span key={d.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flex: 'none' }} aria-hidden />
            <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
            <span style={{ fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>{d.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
