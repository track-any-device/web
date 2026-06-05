import type { Metadata } from 'next';
import TenantsClient from './tenants-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Tenants' };

export default function MyTenantsPage() {
    return <TenantsClient />;
}
