'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
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
    date_of_birth: string;
    phone: string;
    timezone: string;
}

export default function EditProfilePage() {
    const router = useRouter();
    const { token } = useAuth();

    const [form, setForm]     = useState<ProfileData>({ name: '', date_of_birth: '', phone: '', timezone: '' });
    const [loading, setLoading]   = useState(true);
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [success, setSuccess]   = useState(false);

    useEffect(() => {
        if (!token) return;
        new ApiClient(token).profile()
            .then((data) => {
                setForm({
                    name:          data.name          ?? '',
                    date_of_birth: data.date_of_birth ?? '',
                    phone:         data.phone         ?? '',
                    timezone:      data.timezone      ?? '',
                });
            })
            .catch(() => setError('Could not load profile.'))
            .finally(() => setLoading(false));
    }, [token]);

    // Keep the single portal satellite up until this page's data has loaded.
    useTrackLoading(loading);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await new ApiClient(token!).updateProfile({
                name: form.name,
                date_of_birth: form.date_of_birth || null,
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
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-7">
            <div className="max-w-lg space-y-6">

            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/my/profile"
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    <ArrowLeft className="w-4 h-4" /> My profile
                </Link>
            </div>
            <h1 className="-mt-2" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>Edit profile</h1>

            {/* While loading the portal LoadingProvider overlay covers this area (no bare text). */}
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

                        {/* Date of birth */}
                        <div className="tad-field">
                            <label htmlFor="date_of_birth" className="tad-field__label">
                                Date of birth
                            </label>
                            <input
                                id="date_of_birth"
                                type="date"
                                value={form.date_of_birth}
                                onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                                max={new Date().toISOString().slice(0, 10)}
                                min="1900-01-01"
                                className="tad-input"
                            />
                        </div>

                        {/* Phone (read-only — login identity) */}
                        <div className="tad-field">
                            <label htmlFor="phone" className="tad-field__label">
                                Phone
                                <span className="ml-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)', fontWeight: 'var(--weight-regular)' }}>(your login number — contact support to change)</span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                disabled
                                className="tad-input tad-input--mono"
                                placeholder="—"
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
        </div>
    );
}
