import type { Metadata } from 'next';
import StreamPageClient from './stream-page-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Live Stream' };

export default function LiveStreamPage() {
    return <StreamPageClient />;
}
