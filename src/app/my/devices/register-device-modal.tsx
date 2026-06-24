'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

interface Props {
    token: string;
    onClose: () => void;
    onRegistered: (deviceId: number, name: string) => void;
}

// Quick-pick thing names (the design-system device kinds) — tap to fill, then customise.
const NAME_SUGGESTIONS = ['My car', 'My bike', 'Truck', 'Van', 'Person', 'Asset', 'Generator'];

export default function RegisterDeviceModal({ token, onClose, onRegistered }: Props) {
    const [input,   setInput]   = useState('');
    const [name,    setName]    = useState('');
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
        if (!name.trim()) {
            setError('Give your thing a name so you can find it later.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const api = new ApiClient(token);
            const res = await api.registerDevice(trimmed, name);
            setSuccess(res.message);
            if (res.device_id) {
                setTimeout(() => {
                    onRegistered(res.device_id!, name.trim() || res.name || 'New Device');
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
                <div className="w-full max-w-sm p-6 relative"
                    style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={onClose} className="tad-iconbtn tad-iconbtn--sm absolute top-3 right-3" aria-label="Close">
                        <X className="w-4 h-4" />
                    </button>

                    <h2 className="mb-1" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>Register a device</h2>
                    <p className="mb-5" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Enter the last 10 digits of the IMEI printed on your device. P901 devices: use the 11-digit phone number shown on the label (with leading zero).
                    </p>

                    {success ? (
                        <div className="px-4 py-4 text-center"
                            style={{ borderRadius: 'var(--radius-lg)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)', fontSize: 'var(--text-sm)', color: 'var(--success)' }}>
                            {success}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block mb-1.5" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Device ID</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="\d*"
                                    maxLength={16}
                                    value={input}
                                    onChange={e => { setInput(e.target.value.replace(/\D/g, '')); setError(null); }}
                                    placeholder="e.g. 0123456789"
                                    autoFocus
                                    className="tad-input tad-input--mono w-full"
                                    style={{ letterSpacing: '0.12em' }}
                                />
                                {error && (
                                    <p className="mt-1.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>{error}</p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-1.5" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>Name your thing</label>
                                <input
                                    type="text"
                                    maxLength={120}
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(null); }}
                                    placeholder="e.g. My Corolla"
                                    className="tad-input w-full"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {NAME_SUGGESTIONS.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => { setName(s); setError(null); }}
                                            style={{
                                                fontSize: 'var(--text-xs)', padding: '4px 11px', borderRadius: 'var(--radius-pill)',
                                                border: `1px solid ${name === s ? 'var(--brand)' : 'var(--border)'}`,
                                                background: name === s ? 'var(--brand-subtle)' : 'var(--surface)',
                                                color: name === s ? 'var(--brand)' : 'var(--text-secondary)', cursor: 'pointer',
                                            }}
                                        >{s}</button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || input.length < 8 || !name.trim()}
                                className="tad-btn tad-btn--primary tad-btn--block">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Looking up device…' : 'Register device'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
