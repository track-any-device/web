'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient, type UserProfile } from '@/lib/api-client';

const ROLE_BADGE: Record<string, { className: string; label: string }> = {
    admin:       { className: 'tad-badge tad-badge--danger',  label: 'Admin'       },
    supervisor:  { className: 'tad-badge tad-badge--warning', label: 'Supervisor'  },
    tenant_user: { className: 'tad-badge tad-badge--brand',   label: 'Tenant user' },
    user:        { className: 'tad-badge tad-badge--neutral', label: 'User'        },
};

export default function ProfileClient() {
    const { token, user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile,      setProfile]      = useState<UserProfile | null>(null);
    const [deviceCount,  setDeviceCount]  = useState<number>(0);
    const [loading,      setLoading]      = useState(true);

    // Avatar upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
    const [uploading,   setUploading]   = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!token) { router.push('/login'); return; }

        const api = new ApiClient(token);
        Promise.allSettled([
            api.profile(),
            api.dashboard(),
        ]).then(([profileRes, dashRes]) => {
            if (profileRes.status === 'fulfilled') {
                setProfile(profileRes.value);
                setAvatarUrl(profileRes.value.avatar_url ?? null);
            }
            if (dashRes.status === 'fulfilled') setDeviceCount(dashRes.value.device_count ?? 0);
        }).finally(() => setLoading(false));
    }, [token, authLoading, router]);

    async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file
        if (!file || !token) return;
        setUploading(true);
        setUploadError(null);
        try {
            const { avatar_url } = await new ApiClient(token).uploadAvatar(file);
            setAvatarUrl(avatar_url);
            setProfile(p => (p ? { ...p, avatar_url } : p));
        } catch (err) {
            setUploadError((err as { message?: string })?.message ?? 'Could not upload the image. Please try again.');
        } finally {
            setUploading(false);
        }
    }

    // Keep the single portal satellite up until auth + this page's data have loaded.
    useTrackLoading(authLoading || loading);

    if (authLoading || loading) {
        return null; // the portal LoadingProvider overlay covers this area
    }

    const role         = profile?.role ?? (authUser as { role?: string } | null)?.role ?? 'user';
    const badge        = ROLE_BADGE[role] ?? ROLE_BADGE.user;
    const displayName  = profile?.name  ?? authUser?.name  ?? '—';

    return (
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 space-y-6 sm:px-6 lg:px-7">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>My profile</h1>
                <Link href="/my/profile/edit" className="tad-btn tad-btn--secondary tad-btn--sm">
                    Edit profile
                </Link>
            </div>

            {/* Avatar + name card */}
            <div className="tad-card tad-card--raised">
                <div className="tad-card__body flex items-center gap-5">
                    <div className="relative shrink-0">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-16 h-16 rounded-2xl object-cover"
                                style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, var(--pak-700), var(--pak-400))', color: '#fff', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-display)' }}>
                                {displayName[0]?.toUpperCase() ?? '?'}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            aria-label="Change photo"
                            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
                        >
                            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={onPickAvatar}
                            className="hidden"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>{displayName}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={badge.className}>{badge.label}</span>
                            {deviceCount > 0 && (
                                <span className="tad-badge tad-badge--neutral tad-badge--mono">
                                    {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="mt-2 inline-flex items-center gap-1.5"
                            style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--brand)' }}
                        >
                            <Camera className="w-3.5 h-3.5" />
                            {uploading ? 'Uploading…' : 'Change photo'}
                        </button>
                    </div>
                </div>
                {uploadError && (
                    <div className="mx-5 mb-5 -mt-1 rounded-lg px-3 py-2"
                        style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                        {uploadError}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="tad-card">
                <div className="tad-card__body--flush" style={{ display: 'flex', flexDirection: 'column' }}>
                    {[
                        { label: 'Full name',     value: profile?.name ?? displayName, mono: false, hint: null as string | null },
                        {
                            label: 'Date of birth',
                            value: profile?.date_of_birth
                                ? new Date(profile.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—',
                            mono: false,
                            hint: null,
                        },
                        { label: 'Phone', value: profile?.phone ?? '—', mono: true, hint: 'Your login number — contact support to change' },
                        { label: 'Timezone', value: profile?.timezone ?? '—', mono: false, hint: null },
                        {
                            label: 'Member since',
                            value: profile?.created_at
                                ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : '—',
                            mono: true,
                            hint: null,
                        },
                    ].map((row, i) => (
                        <div key={row.label} className="px-4 py-4 flex items-center justify-between gap-4 sm:px-6"
                            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                            <div className="shrink-0">
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{row.label}</p>
                                {row.hint && (
                                    <p className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-subtle)' }}>{row.hint}</p>
                                )}
                            </div>
                            <p className="min-w-0 text-right break-words" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)', fontFamily: row.mono ? 'var(--font-mono)' : undefined }}>{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit CTA */}
            <div className="flex justify-end">
                <Link href="/my/profile/edit" className="tad-btn tad-btn--primary">
                    Edit profile
                </Link>
            </div>
        </div>
    );
}
