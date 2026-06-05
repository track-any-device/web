import type { Metadata } from 'next';
import BeatEditClient from './beat-edit-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Edit Beat' };

export default async function BeatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <BeatEditClient id={id} />;
}
