import type { Metadata } from 'next';
import BeatsClient from './beats-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'My Beats' };

export default function MyBeatsPage() {
    return <BeatsClient />;
}
