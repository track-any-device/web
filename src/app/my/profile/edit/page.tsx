'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ApiClient } from '@/lib/api-client';

const TIMEZONES = [
    'UTC',
    'Asia/Karachi',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Australia/Sydney',
    'Pacific/Auckland',
];

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    timezone: string;
}

export default function EditProfilePage() {
    const router = useRouter();
    const { token } = useAuth();

    const [form, setForm]     = useState<ProfileData>({ name: '', email: '', phone: '', timezone: '' });
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [success, setSuccess]   = useState(false);

    useEffect(() => {
        if (!token) return;
        new ApiClient(token).profile()
            .then((data) => {
                setForm({
                    name:     data.name     ?? '',
                    email:    data.email    ?? '',
                    phone:    data.phone    ?? '',
                    timezone: data.timezone ?? '',
                });
            })
            .catch(() => setError('Could not load profile.'))
            .finally(() => setLoading(false));
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await new ApiClient(token!).updateProfile({
                name: form.name,
                phone: form.phone,
                timezone: form.timezone,
            });
            setSuccess(true);
            setTimeout(() => router.push('/my/profile'), 1200);
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message;
            setError(msg ?? 'Failed to save changes. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-lg px-6 py-8 space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/my/profile"
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    <ArrowLeft className="w-4 h-4" /> My profile
                </Link>
            </div>
            <h1 className="-mt-2" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>Edit profile</h1>

            {loading && (
                <div className="py-12 text-center" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading profile…</div>
            )}

            {!loading && (
                <form onSubmit={handleSubmit} className="tad-card tad-card--raised">
                    <div className="tad-card__body space-y-5">

                        {error && (
                            <div className="rounded-lg px-4 py-3"
                                style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="rounded-lg px-4 py-3"
                                style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                                Profile saved — redirecting…
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="tad-field">
                            <label htmlFor="name" className="tad-field__label">
                                Full name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                required
                                className="tad-input"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Email (read-only) */}
                        <div className="tad-field">
                            <label className="tad-field__label">
                                Email
                                <span className="ml-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontWeight: 'var(--weight-regular)' }}>(managed via SSO)</span>
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                disabled
                                className="tad-input"
                            />
                        </div>

                        {/* Phone */}
                        <div className="tad-field">
                            <label htmlFor="phone" className="tad-field__label">
                                Phone
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                className="tad-input tad-input--mono"
                                placeholder="+92 300 0000000"
                            />
                        </div>

                        {/* Timezone */}
                        <div className="tad-field">
                            <label htmlFor="timezone" className="tad-field__label">
                                Timezone
                            </label>
                            <select
                                id="timezone"
                                value={form.timezone}
                                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                                className="tad-select"
                            >
                                <option value="">— Select timezone —</option>
                                {TIMEZONES.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Link href="/my/profile" className="tad-btn tad-btn--secondary tad-btn--sm">
                                Cancel
                            </Link>
                            <button type="submit" disabled={saving} className="tad-btn tad-btn--primary">
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
