import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ApiClient } from '@/lib/api-client';
import type { Metadata } from 'next';
import BeatForm from '../beat-form';
import DeleteBeatButton from './delete-button';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'Edit Beat' };

export default async function BeatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) redirect('/api/auth/login');

    const api = new ApiClient(session.token);

    let beat: Awaited<ReturnType<typeof api.beat>>;
    try {
        beat = await api.beat(Number(id));
    } catch {
        notFound();
    }

    return (
        <div className="p-8 max-w-3xl space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <a href="/my/beats" className="text-xs text-blue-600 hover:underline">← My Beats</a>
                    <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{beat.name}</h1>
                    {beat.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{beat.description}</p>
                    )}
                </div>
                <DeleteBeatButton beatId={beat.id} token={session.token} />
            </div>

            <BeatForm token={session.token} beat={beat} />
        </div>
    );
}
