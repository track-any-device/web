import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import type { Metadata } from 'next';
import BeatForm from '../beat-form';

export const runtime = 'edge';
export const metadata: Metadata = { title: 'New Beat' };

export default async function CreateBeatPage() {
    const session = await getSession();
    if (!session) redirect('/api/auth/login');

    return (
        <div className="p-8 max-w-3xl space-y-6">
            <div>
                <a href="/my/beats" className="text-xs text-blue-600 hover:underline">← My Beats</a>
                <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">New Beat</h1>
                <p className="text-sm text-gray-500 mt-0.5">Draw a geofence polygon on the map or import a .kml file.</p>
            </div>

            <BeatForm token={session.token} />
        </div>
    );
}
