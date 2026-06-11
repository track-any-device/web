'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';
import type { Device } from '@/lib/api-client';

export default function DeleteBeatButton({ beatId, token }: { beatId: number; token: string }) {
    const router = useRouter();

    const [open,     setOpen]     = useState(false);
    const [devices,  setDevices]  = useState<Device[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function openConfirm() {
        setOpen(true);
        setLoading(true);
        try {
            const res = await new ApiClient(token).devices();
            setDevices(res.data.filter(d => d.current_beat?.id === beatId));
        } catch {
            setDevices([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await new ApiClient(token).deleteBeat(beatId);
            router.push('/my/beats');
            router.refresh();
        } finally {
            setDeleting(false);
            setOpen(false);
        }
    }

    return (
        <>
            <button onClick={openConfirm}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Delete
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">

                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Delete beat?</h2>
                            <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
                        </div>

                        <div className="px-6 py-4 space-y-3">
                            {loading ? (
                                <p className="text-sm text-gray-400">Checking assigned devices…</p>
                            ) : devices.length > 0 ? (
                                <div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        The following {devices.length === 1 ? 'device is' : `${devices.length} devices are`} currently assigned to this beat and will be unassigned:
                                    </p>
                                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {devices.map(d => (
                                            <li key={d.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                                                <span className="text-xs text-gray-400">{d.imei}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 dark:text-gray-400">No devices are currently assigned to this beat.</p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <button onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting || loading}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
                                {deleting ? 'Deleting…' : 'Yes, delete beat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
