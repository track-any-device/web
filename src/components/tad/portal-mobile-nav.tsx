'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/tad/logo';
import { UserMenu } from '@/components/tad/user-menu';
import { Icon, type PortalNavItem, type PortalUser } from '@/components/tad/portal-shell';
import { cn } from '@/lib/cn';

/* Mobile chrome for the internal portals (admin + operations).

   At lg+ the persistent PortalSidebar handles all navigation, so this whole component is hidden.
   Below lg the sidebar is hidden and this renders:
     • a sticky top bar — the TAD logo + a hamburger (sits beside the per-page PortalTopbar, which
       flows directly beneath it);
     • a slide-in drawer (scrim + left sheet) opening the SAME nav as the desktop sidebar, with the
       nested "Dashboards" group, active states, and the avatar UserMenu reachable inside.

   The drawer closes on route change, Escape, and scrim click, and locks body scroll while open —
   mirroring the marketing MobileNav so the two feel identical. prefers-reduced-motion is honoured
   by the .tad-pmnav* keyframes in tad.css. */

/** Active when the pathname matches this item (exact match, or a prefix when not `exact`). */
function isActive(item: PortalNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');
}

function DrawerLink({
  item,
  pathname,
  nested,
  onNavigate,
}: {
  item: PortalNavItem;
  pathname: string;
  nested?: boolean;
  onNavigate: () => void;
}) {
  const active = isActive(item, pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn('tad-portal__nav-item', nested && 'tad-portal__nav-item--sub', active && 'is-active')}
    >
      {!nested && <Icon name={item.icon} />}
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.count != null && <span className="tad-portal__nav-count">{item.count}</span>}
      {item.badge != null && <span className="tad-portal__nav-badge">{item.badge}</span>}
    </Link>
  );
}

function DrawerGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: PortalNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isActive(c, pathname));
  const headerActive = isActive(item, pathname);
  const expanded = headerActive || childActive;
  return (
    <div className="tad-portal__nav-group">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-expanded={expanded}
        aria-current={headerActive ? 'page' : undefined}
        className={cn('tad-portal__nav-item', (headerActive || childActive) && 'is-active')}
      >
        <Icon name={item.icon} />
        <span style={{ flex: 1 }}>{item.label}</span>
      </Link>
      {expanded && (
        <div className="tad-portal__nav-sublist">
          {children.map((c) => (
            <DrawerLink key={c.href} item={c} pathname={pathname} nested onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PortalMobileNav({ nav, user }: { nav: PortalNavItem[]; user?: PortalUser }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname() ?? '';

  // Close on route change.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + close on Escape while the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = React.useCallback(() => setOpen(false), []);

  return (
    <div className="tad-pmnav">
      {/* Sticky mobile bar — logo + hamburger. The per-page PortalTopbar sits directly beneath. */}
      <div className="tad-pmnav__bar">
        <Link href="/" aria-label="TAD-PAK home" className="tad-pmnav__logo"><Logo /></Link>
        <button
          type="button"
          className="tad-pmnav__toggle"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {open && (
        <>
          <div className="tad-pmnav__scrim" onClick={close} aria-hidden />
          <div className="tad-pmnav__sheet" role="dialog" aria-modal="true" aria-label="Portal navigation">
            <div className="tad-pmnav__head">
              <Link href="/" aria-label="TAD-PAK home" onClick={close}><Logo /></Link>
              <button type="button" className="tad-mnav__close" aria-label="Close navigation" onClick={close}>
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            <nav className="tad-pmnav__nav" aria-label="Portal">
              {nav.map((item) =>
                item.children && item.children.length > 0 ? (
                  <DrawerGroup key={item.href} item={item} pathname={pathname} onNavigate={close} />
                ) : (
                  <DrawerLink key={item.href} item={item} pathname={pathname} onNavigate={close} />
                ),
              )}
            </nav>

            {user && (
              <div className="tad-pmnav__user">
                <UserMenu name={user.name} role={user.role} initials={user.initials} placement="up" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
