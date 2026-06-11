'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

interface Props {
    token: string;
    onClose: () => void;
    onRegistered: (deviceId: number, name: string) => void;
}

export default function RegisterDeviceModal({ token, onClose, onRegistered }: Props) {
    const [input,   setInput]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;
        if (!/^\d{8,16}$/.test(trimmed)) {
            setError('Enter the last 10 digits (or 11 with leading 0) printed on your device.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const api = new ApiClient(token);
            const res = await api.registerDevice(trimmed);
            setSuccess(res.message);
            if (res.device_id) {
                setTimeout(() => {
                    onRegistered(res.device_id!, res.name ?? 'New Device');
                }, 1200);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            // Extract the message from the API error format [API] POST ... → 4xx: {"message":"..."}
            const match = msg.match(/"message"\s*:\s*"([^"]+)"/);
            setError(match ? match[1] : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
                <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 relative" onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                    </button>

                    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Register a Device</h2>
                    <p className="text-xs text-gray-500 mb-5">
                        Enter the last 10 digits of the IMEI printed on your device. P901 devices: use the 11-digit phone number shown on the label (with leading zero).
                    </p>

                    {success ? (
                        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
                            {success}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Device ID</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={16}
                                    value={input}
                                    onChange={e => { setInput(e.target.value.replace(/\D/g, '')); setError(null); }}
                                    placeholder="e.g. 0123456789"
                                    autoFocus
                                    className="w-full text-sm font-mono rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 tracking-widest"
                                />
                                {error && (
                                    <p className="text-xs text-red-600 mt-1.5">{error}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || input.length < 8}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Looking up device…' : 'Register Device'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
