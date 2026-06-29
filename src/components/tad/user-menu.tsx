'use client';

import React from 'react';
import Link from 'next/link';
import {
  User,
  Smartphone,
  Package,
  CircleUser,
  Building2,
  Wrench,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { clearAuth } from '@/lib/auth-store';
import { OPS_ROLES, ADMIN_ROLES, ROLE_LABEL, type Role } from '@/lib/portal-data';

/* Shared avatar dropdown — used in PortalShell (admin/operations sidebar) and MyPortalShell (/my).
   Round avatar button (initials, falls back to a User icon) → menu with: name + role chip, a divider,
   "Back to site" (/), "My things" (/my), staff-only "Operations" (/operations) + "Admin" (/admin),
   a divider, then "Sign out". Closes on outside-click + Escape; the button is aria-haspopup/expanded
   and the panel is role=menu. Styling lives in tad.css (.tad-usermenu*). */

export interface UserMenuProps {
  name: string;
  /** Raw role key (e.g. 'admin', 'procurement') — drives the role chip label + staff link gating. */
  role: string;
  /** Optional pre-computed initials; derived from `name` when omitted. */
  initials?: string;
  /** Where the panel opens. Use 'up' when the trigger sits low (the sidebar bottom); 'down' for top bars. */
  placement?: 'up' | 'down';
  /** Show the "My tenants" link. Only the /my shell sets this (after a live /api/my/tenants probe);
   *  the ops/admin shells leave it default-false so the link never appears there. */
  hasTenants?: boolean;
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserMenu({ name, role, initials, placement = 'down', hasTenants = false }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const firstItemRef = React.useRef<HTMLAnchorElement>(null);

  const isOps = OPS_ROLES.includes(role as Role);
  const isAdmin = ADMIN_ROLES.includes(role as Role);
  const roleLabel = ROLE_LABEL[role] ?? role ?? 'Account';
  const avatarInitials = (initials && initials.trim()) || deriveInitials(name);

  // Close on outside-click + Escape.
  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Move focus into the menu when it opens (accessibility).
  React.useEffect(() => {
    if (open) firstItemRef.current?.focus();
  }, [open]);

  async function signOut() {
    setOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore — clear locally regardless */
    }
    clearAuth();
    window.location.href = '/login';
  }

  return (
    <div className={`tad-usermenu${placement === 'up' ? ' tad-usermenu--up' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="tad-usermenu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="tad-usermenu__avatar" aria-hidden>
          {avatarInitials || <User size={16} strokeWidth={2} />}
        </span>
        <span className="tad-usermenu__triggername">{name}</span>
        <ChevronDown size={15} strokeWidth={2.2} className="tad-usermenu__caret" aria-hidden data-open={open || undefined} />
      </button>

      {open && (
        <div className="tad-usermenu__panel" role="menu" aria-label="Account">
          <div className="tad-usermenu__head">
            <span className="tad-usermenu__avatar tad-usermenu__avatar--lg" aria-hidden>
              {avatarInitials || <User size={18} strokeWidth={2} />}
            </span>
            <div className="tad-usermenu__id">
              <div className="tad-usermenu__name">{name}</div>
              <span className="tad-usermenu__role">
                <ShieldCheck size={12} strokeWidth={2.2} aria-hidden />
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="tad-usermenu__divider" role="separator" />

          <Link href="/my/devices" className="tad-usermenu__item" role="menuitem" ref={firstItemRef} onClick={() => setOpen(false)}>
            <Smartphone size={16} strokeWidth={2} aria-hidden />
            My devices
          </Link>
          <Link href="/my/orders" className="tad-usermenu__item" role="menuitem" onClick={() => setOpen(false)}>
            <Package size={16} strokeWidth={2} aria-hidden />
            My orders
          </Link>
          <Link href="/my/profile" className="tad-usermenu__item" role="menuitem" onClick={() => setOpen(false)}>
            <CircleUser size={16} strokeWidth={2} aria-hidden />
            My profile
          </Link>
          {hasTenants && (
            <Link href="/my/tenants" className="tad-usermenu__item" role="menuitem" onClick={() => setOpen(false)}>
              <Building2 size={16} strokeWidth={2} aria-hidden />
              My tenants
            </Link>
          )}
          {isOps && (
            <Link href="/operations" className="tad-usermenu__item" role="menuitem" onClick={() => setOpen(false)}>
              <Wrench size={16} strokeWidth={2} aria-hidden />
              Operations
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="tad-usermenu__item" role="menuitem" onClick={() => setOpen(false)}>
              <ShieldCheck size={16} strokeWidth={2} aria-hidden />
              Admin
            </Link>
          )}

          <div className="tad-usermenu__divider" role="separator" />

          <button type="button" className="tad-usermenu__item tad-usermenu__item--danger" role="menuitem" onClick={signOut}>
            <LogOut size={16} strokeWidth={2} aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
