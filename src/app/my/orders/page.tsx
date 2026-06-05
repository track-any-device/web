import type { Metadata } from 'next';
import OrdersClient from './orders-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Orders' };

export default function MyOrdersPage() {
    return <OrdersClient />;
}
