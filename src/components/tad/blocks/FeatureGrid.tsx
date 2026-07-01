import React from 'react';
import {
  MapPin, Bell, ShieldCheck, Shield, Route, Navigation, Clock, History,
  Gauge, Battery, Zap, Users, Car, Bike, Truck, Map, Radar, Activity,
  BellRing, Lock, Wifi, Signal, Smartphone, Globe, Sparkles, Star,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Section } from '@/components/tad/marketing';
import type { FeatureGridData } from '@/lib/pages';

/* Small curated name → lucide-react component map. Authors set `icon` to one of these names in
   Sanity (e.g. 'MapPin'); unknown/empty names fall back to `Sparkles`. Kept as an explicit map so
   we don't pull lucide's full icon set into the bundle. */
const ICONS: Record<string, LucideIcon> = {
  MapPin, Bell, BellRing, ShieldCheck, Shield, Route, Navigation, Clock, History,
  Gauge, Battery, Zap, Users, Car, Bike, Truck, Map, Radar, Activity,
  Lock, Wifi, Signal, Smartphone, Globe, Sparkles, Star,
};
const FALLBACK_ICON: LucideIcon = Sparkles;

const COL_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function FeatureGrid({ eyebrow, title, subtitle, columns = 3, features }: FeatureGridData) {
  const items = (features ?? []).filter((f) => f?.title || f?.text);
  if (items.length === 0) return null;

  const cols = columns === 2 || columns === 4 ? columns : 3;

  return (
    <Section eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <div className={`grid grid-cols-1 gap-5 ${COL_CLASS[cols]}`}>
        {items.map((f, i) => {
          const Icon = (f.icon && ICONS[f.icon]) || FALLBACK_ICON;
          return (
            <Card key={i} className="grid gap-3 p-6">
              <span
                className="grid h-11 w-11 place-items-center rounded-[var(--radius-lg)] text-[var(--brand-on-subtle)]"
                style={{ background: 'var(--brand-subtle)' }}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
              {f.title && <h3 className="text-[length:var(--text-lg)] font-bold">{f.title}</h3>}
              {f.text && <p className="m-0 text-[length:var(--text-base)] leading-normal text-[var(--text-secondary)]">{f.text}</p>}
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
