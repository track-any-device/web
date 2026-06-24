'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/tad/logo';
import { UserMenu } from '@/components/tad/user-menu';
import { cn } from '@/lib/cn';

/* Internal-portal chrome (operations + admin) — persistent left sidebar + per-page topbar.
   Scoped under `.tad`; built on the design tokens. Mirrors the design-skill FleetChrome. */

export type IconName =
  | 'grid' | 'box' | 'wrench' | 'truck' | 'bell' | 'users' | 'building'
  | 'cpu' | 'alert' | 'tag' | 'map' | 'settings' | 'message';

const PATHS: Record<IconName, string> = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2z',
  truck: 'M1 3h13v10H1zM14 7h4l3 3v3h-7zM5.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M9 11h1M9 15h1M14 7h1M14 11h1M14 15h1',
  cpu: 'M4 4h16v16H4zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  tag: 'M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  map: 'M9 3 3 6v15l6-3 6 3 6-3V3l-6 3zM9 3v15M15 6v15',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
  message: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-1L3 21l1.9-5a8.4 8.4 0 0 1-1-4 8.5 8.5 0 0 1 8.4-8.4h.5A8.5 8.5 0 0 1 21 11z',
};

export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export interface PortalNavItem {
  href: string;
  label: string;
  icon: IconName;
  count?: number;
  badge?: number;
  exact?: boolean; // match only the exact path (e.g. a section index like /admin)
  /** Optional nested entries. When present this item renders as an expandable group
     header (its own `href` still navigates) and the children render indented beneath it.
     Flat navs (no `children`) are unaffected — the existing portals keep working as-is. */
  children?: PortalNavItem[];
}

export interface PortalUser {
  name: string;
  role: string;
  initials: string;
}

/** Active when the pathname matches this item (exact match, or a prefix when not `exact`). */
function isNavItemActive(item: PortalNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
}

/** A single flat nav link (used both at top level and, indented, as a group child). */
function NavLink({ item, pathname, nested }: { item: PortalNavItem; pathname: string; nested?: boolean }) {
  const active = isNavItemActive(item, pathname);
  return (
    <Link
      href={item.href}
      className={cn('tad-portal__nav-item', nested && 'tad-portal__nav-item--sub', active && 'is-active')}
    >
      {!nested && <Icon name={item.icon} />}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count != null && <span className="tad-portal__nav-count">{item.count}</span>}
      {item.badge != null && <span className="tad-portal__nav-badge">{item.badge}</span>}
    </Link>
  );
}

/** An expandable group: header link + indented children. Expanded whenever the header
   itself or any child is active (no client state needed — purely path-driven). */
function NavGroup({ item, pathname }: { item: PortalNavItem; pathname: string }) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isNavItemActive(c, pathname));
  const headerActive = isNavItemActive(item, pathname);
  const expanded = headerActive || childActive;
  return (
    <div className="tad-portal__nav-group">
      <Link
        href={item.href}
        aria-expanded={expanded}
        className={cn('tad-portal__nav-item', (headerActive || childActive) && 'is-active')}
      >
        <Icon name={item.icon} />
        <span style={{ flex: 1 }}>{item.label}</span>
        <Chevron open={expanded} />
      </Link>
      {expanded && (
        <div className="tad-portal__nav-sublist">
          {children.map((c) => (
            <NavLink key={c.href} item={c} pathname={pathname} nested />
          ))}
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flex: 'none', transition: 'transform .15s', transform: open ? 'rotate(90deg)' : 'none', opacity: 0.7 }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PortalSidebar({ nav, user }: { nav: PortalNavItem[]; user?: PortalUser }) {
  const pathname = usePathname();
  return (
    <aside className="tad-portal__sidebar">
      <div style={{ padding: '2px 8px 18px' }}>
        <Link href="/" aria-label="TAD-PAK home"><Logo /></Link>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {nav.map((item) =>
          item.children && item.children.length > 0 ? (
            <NavGroup key={item.href} item={item} pathname={pathname} />
          ) : (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ),
        )}
      </nav>
      {user && (
        <div className="tad-portal__user">
          <UserMenu name={user.name} role={user.role} initials={user.initials} placement="up" />
          <div style={{ lineHeight: 1.3, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Account menu</div>
          </div>
        </div>
      )}
    </aside>
  );
}

export function PortalTopbar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="tad-portal__topbar">
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.015em', color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{right}</div>}
    </header>
  );
}
