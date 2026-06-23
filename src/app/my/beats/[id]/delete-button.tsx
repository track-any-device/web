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
    const [error,    setError]    = useState<string | null>(null);

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
        setError(null);
        try {
            await new ApiClient(token).deleteBeat(beatId);
            router.push('/my/devices');
            router.refresh();
        } catch (e) {
            // Keep the dialog open and surface the failure instead of silently closing.
            setError(e instanceof Error ? e.message : 'Could not delete the beat. Please try again.');
            setDeleting(false);
        }
    }

    return (
        <>
            <button onClick={openConfirm} className="tad-btn tad-btn--sm shrink-0"
                style={{ color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)', background: 'transparent' }}>
                Delete
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,16,8,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="tad-card tad-card--raised w-full max-w-md" style={{ boxShadow: 'var(--shadow-xl)' }}>

                        <div className="tad-card__header" style={{ display: 'block' }}>
                            <h2 className="tad-card__title">Delete beat?</h2>
                            <p className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>This action cannot be undone.</p>
                        </div>

                        <div className="tad-card__body space-y-3">
                            {loading ? (
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Checking assigned devices…</p>
                            ) : devices.length > 0 ? (
                                <div>
                                    <p className="mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        The following {devices.length === 1 ? 'device is' : `${devices.length} devices are`} currently assigned to this beat and will be unassigned:
                                    </p>
                                    <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {devices.map(d => (
                                            <li key={d.id} className="flex items-center gap-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />
                                                <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text)' }}>{d.name}</span>
                                                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{d.imei}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>No devices are currently assigned to this beat.</p>
                            )}
                            {error && (
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>{error}</p>
                            )}
                        </div>

                        <div className="tad-card__footer flex items-center justify-end gap-3">
                            <button onClick={() => setOpen(false)} className="tad-btn tad-btn--secondary tad-btn--sm">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting || loading} className="tad-btn tad-btn--danger tad-btn--sm">
                                {deleting ? 'Deleting…' : 'Yes, delete beat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
