'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    ← My Profile
                </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white -mt-2">Edit Profile</h1>

            {loading && (
                <div className="py-12 text-center text-sm text-gray-400">Loading profile…</div>
            )}

            {!loading && (
                <form onSubmit={handleSubmit}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">

                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                            Profile saved — redirecting…
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            required
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Your full name"
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                            <span className="ml-2 text-xs text-gray-400 font-normal">(managed via SSO)</span>
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            disabled
                            className="w-full rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+92 300 0000000"
                        />
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1.5">
                        <label htmlFor="timezone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Timezone
                        </label>
                        <select
                            id="timezone"
                            value={form.timezone}
                            onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">— Select timezone —</option>
                            {TIMEZONES.map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <Link href="/my/profile"
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-all"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
