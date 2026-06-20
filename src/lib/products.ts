import type { ProductCategory } from '@/components/tad/marketing';

/* Local placeholder catalog — the live source is the Sanity DeviceType catalog via
   `getDeviceTypes()` in `@/lib/catalog`; this is the graceful fallback until Sanity read
   access is fully wired. Models + protocols match the locked device list. */

export type Product = {
  name: string;
  slug: string;
  category: ProductCategory;
  image?: string;
  price?: number; // PKR
  vendor?: string;
  protocol?: 'GT06' | 'JT808';
};

export const PRODUCTS: Product[] = [
  { name: 'Concox GT06N', slug: 'concox-gt06n', category: 'car', image: '/devices/concox-gt06n.png', price: 6500, vendor: 'Concox', protocol: 'GT06' },
  { name: 'Wanwaytech G18', slug: 'wanwaytech-g18', category: 'car', image: '/devices/wanwaytech-g18.png', price: 7200, vendor: 'Wanway', protocol: 'GT06' },
  { name: 'Gosafe G1C', slug: 'gosafe-g1c', category: 'bike', image: '/devices/gosafe-g1c.png', price: 5400, vendor: 'Gosafe' },
  { name: 'Concox VL103', slug: 'concox-vl103', category: 'bike', image: '/devices/concox-vl103.png', price: 5900, vendor: 'Concox', protocol: 'GT06' },
  { name: 'Teltonika TMT250', slug: 'teltonika-tmt250', category: 'person', image: '/devices/teltonika-tmt250.jpg', price: 9800, vendor: 'Teltonika' },
];
