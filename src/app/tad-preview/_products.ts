import type { ProductCategory } from '@/components/tad/marketing';

/* Placeholder catalog for the rebrand previews — wire to the Sanity DeviceType catalog in Phase 4/5b.
   Models + protocols match the locked device list (see docs/audit/PENDING-CHANGES.md). */

export type Product = {
  name: string;
  category: ProductCategory;
  image?: string;
  price?: number; // PKR
  vendor?: string;
  protocol?: 'GT06' | 'JT808';
};

export const PRODUCTS: Product[] = [
  { name: 'Concox GT06N', category: 'car', image: '/devices/concox-gt06n.png', price: 6500, vendor: 'Concox', protocol: 'GT06' },
  { name: 'Wanwaytech G18', category: 'car', image: '/devices/wanwaytech-g18.png', price: 7200, vendor: 'Wanway', protocol: 'GT06' },
  { name: 'Gosafe G1C', category: 'bike', image: '/devices/gosafe-g1c.png', price: 5400, vendor: 'Gosafe' },
  { name: 'Concox VL103', category: 'bike', image: '/devices/concox-vl103.png', price: 5900, vendor: 'Concox', protocol: 'GT06' },
  { name: 'Teltonika TMT250', category: 'person', image: '/devices/teltonika-tmt250.jpg', price: 9800, vendor: 'Teltonika' },
];
