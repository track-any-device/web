/* The public web navigation — shown in the marketing header AND the /my portal header so the
   site nav is consistent everywhere. Plain data (no server-only imports) so it can be imported
   into both server and client shells. */
export const SITE_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'For business', href: '/business' },
  { label: 'Support', href: '/support' },
];
