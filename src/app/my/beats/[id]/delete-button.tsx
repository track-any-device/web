'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.track-any-device.com';

export default function DeleteBeatButton({ beatId, token }: { beatId: number; token: string }) {
    const router  = useRouter();
    const [busy,    setBusy]    = useState(false);
    const [confirm, setConfirm] = useState(false);

    async function handleDelete() {
        setBusy(true);
        try {
            await fetch(`${API_URL}/api/my/beats/${beatId}`, {
                method:  'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            router.push('/my/beats');
            router.refresh();
        } finally {
            setBusy(false);
            setConfirm(false);
        }
    }

    if (confirm) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Delete this beat?</span>
                <button onClick={handleDelete} disabled={busy}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                    {busy ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button onClick={() => setConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button onClick={() => setConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Delete
        </button>
    );
}
