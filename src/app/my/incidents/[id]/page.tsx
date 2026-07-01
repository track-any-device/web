import type { Metadata } from 'next';
import IncidentDetailClient from './incident-detail-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Alert' };

export default async function MyIncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <IncidentDetailClient incidentId={Number(id)} />;
}
