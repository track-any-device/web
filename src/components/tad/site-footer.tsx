import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';

/* Shared TAD-PAK web footer — brand blurb + Track/Company/Account link columns + legal row.
   Used by SiteShell (public/marketing) and MyPortalShell (/my) so the customer portal keeps a
   consistent footer with links back to the public site. PortalShell (admin/ops) has no footer.
   The Account column adapts to auth state (loggedIn). */

type Col = { heading: string; links: { label: string; href: string }[] };

const STATIC_COLS: Col[] = [
  {
    heading: 'Track',
    links: [
      { label: 'Car tracking', href: '/shop?category=car' },
      { label: 'Bike tracking', href: '/shop?category=bike' },
      { label: 'Person trackers', href: '/shop?category=person' },
      { label: 'For business', href: '/business' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Stores', href: '/stores' },
      { label: 'Contact', href: '/contact' },
      { label: 'Help center', href: '/support' },
    ],
  },
];

function accountCol(loggedIn: boolean): Col {
  return {
    heading: 'Account',
    links: loggedIn
      ? [
          { label: 'My devices', href: '/my/devices' },
          { label: 'My orders', href: '/my/orders' },
          { label: 'My profile', href: '/my/profile' },
          { label: 'Status', href: '/status' },
        ]
      : [
          { label: 'Sign in', href: '/login' },
          { label: 'My devices', href: '/my' },
          { label: 'Track an order', href: '/my/orders' },
          { label: 'Status', href: '/status' },
        ],
  };
}

export function SiteFooter({ dark = false, loggedIn = false }: { dark?: boolean; loggedIn?: boolean }) {
  const cols = [...STATIC_COLS, accountCol(loggedIn)];
  return (
    <footer className="tad-footer">
      <div className="tad-footer__inner">
        <div className="tad-footer__cols">
          <div>
            <Logo dark={dark} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 260, marginTop: 12 }}>
              Always know where everything is — friendly real-time GPS tracking for your car, bike,
              and team across Pakistan.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.heading}>
              <div className="tad-footer__heading">{col.heading}</div>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="tad-foot-link">{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="tad-footer__legal">
          <span>© {new Date().getFullYear()} TAD-PAK GPS. All rights reserved.</span>
          <span className="tad-data">Cash on delivery · PKR · Pakistan</span>
        </div>
      </div>
    </footer>
  );
}
