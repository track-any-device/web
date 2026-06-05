import type { Metadata } from 'next';
import IncidentsClient from './incidents-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Incidents' };

export default function MyIncidentsPage() {
    return <IncidentsClient />;
}
