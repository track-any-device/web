import type { Metadata } from 'next';
import BeatCreateClient from './beat-create-client';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'New Beat' };

export default function CreateBeatPage() {
    return <BeatCreateClient />;
}
