'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ExternalLink, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTrackLoading } from '@/components/tad/loading-provider';
import { ApiClient, type UserProfile, type TenantSummary, type Device } from '@/lib/api-client';

const ROLE_BADGE: Record<string, { className: string; label: string }> = {
    admin:       { className: 'tad-badge tad-badge--danger',  label: 'Admin'       },
    supervisor:  { className: 'tad-badge tad-badge--warning', label: 'Supervisor'  },
    tenant_user: { className: 'tad-badge tad-badge--brand',   label: 'Tenant user' },
    user:        { className: 'tad-badge tad-badge--neutral', label: 'User'        },
};

const TENANT_STATUS_DOT: Record<string, string> = {
    active:   'var(--success)',
    inactive: 'var(--text-muted)',
    trial:    'var(--warning)',
    suspended:'var(--danger)',
};

export default function ProfileClient() {
    const { token, user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [profile,      setProfile]      = useState<UserProfile | null>(null);
    const [tenants,      setTenants]      = useState<TenantSummary[]>([]);
    const [deviceCount,  setDeviceCount]  = useState<number>(0);
    const [devices,      setDevices]      = useState<Device[]>([]);
    const [loading,      setLoading]      = useState(true);

    // Move-to-organisation flow
    const [moveDevice,   setMoveDevice]   = useState<Device | null>(null);
    const [moveTenantId, setMoveTenantId] = useState<string>('');
    const [moving,       setMoving]       = useState(false);
    const [moveError,    setMoveError]    = useState<string | null>(null);

    // Tenant request form
    const [showRequest,  setShowRequest]  = useState(false);
    const [orgName,      setOrgName]      = useState('');
    const [reqMessage,   setReqMessage]   = useState('');
    const [submitting,   setSubmitting]   = useState(false);
    const [reqSuccess,   setReqSuccess]   = useState(false);
    const [reqError,     setReqError]     = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!token) { router.push('/login'); return; }

        const api = new ApiClient(token);
        Promise.allSettled([
            api.profile(),
            api.tenants(),
            api.dashboard(),
            api.devices({ per_page: '100' }),
        ]).then(([profileRes, tenantsRes, dashRes, devicesRes]) => {
            if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
            if (tenantsRes.status  === 'fulfilled') setTenants(tenantsRes.value);
            if (dashRes.status     === 'fulfilled') setDeviceCount(dashRes.value.device_count ?? 0);
            if (devicesRes.status  === 'fulfilled') setDevices(devicesRes.value.data ?? []);
        }).finally(() => setLoading(false));
    }, [token, authLoading, router]);

    function openMove(device: Device) {
        setMoveDevice(device);
        setMoveTenantId(tenants[0] ? String(tenants[0].id) : '');
        setMoveError(null);
    }

    async function confirmMove() {
        if (!moveDevice || !moveTenantId || !token) return;
        setMoving(true);
        setMoveError(null);
        try {
            const tenantId = Number(moveTenantId);
            await new ApiClient(token).assignDeviceTenant(Number(moveDevice.id), tenantId);
            // The device leaves the user's personal list once moved.
            setDevices(ds => ds.filter(d => d.id !== moveDevice.id));
            setDeviceCount(c => Math.max(0, c - 1));
            setMoveDevice(null);
        } catch (err) {
            setMoveError((err as { message?: string })?.message ?? 'Could not move the device. Please try again.');
        } finally {
            setMoving(false);
        }
    }

    async function submitRequest(e: React.FormEvent) {
        e.preventDefault();
        if (!orgName.trim() || !token) return;
        setSubmitting(true);
        setReqError(null);
        try {
            await new ApiClient(token).requestTenant({
                org_name: orgName.trim(),
                message:  reqMessage.trim() || undefined,
            });
            setReqSuccess(true);
            setShowRequest(false);
        } catch (err) {
            setReqError((err as { message?: string })?.message ?? 'Failed to submit request.');
        } finally {
            setSubmitting(false);
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
    const displayEmail = profile?.email ?? authUser?.email ?? '—';
    const showTenantRequest = deviceCount > 100;
    // Devices the user still personally owns (not yet moved into an organisation).
    const ownedDevices = devices.filter(d => !d.tenant);
    const moveTargetTenant = tenants.find(t => String(t.id) === moveTenantId);

    return (
        <div className="mx-auto max-w-[1240px] px-4 py-6 space-y-6 sm:px-6 lg:px-7">

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
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--pak-700), var(--pak-400))', color: '#fff', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-display)' }}>
                        {displayName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>{displayName}</p>
                        <p className="truncate mt-0.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{displayEmail}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={badge.className}>{badge.label}</span>
                            {deviceCount > 0 && (
                                <span className="tad-badge tad-badge--neutral tad-badge--mono">
                                    {deviceCount} device{deviceCount !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="tad-card">
                <div className="tad-card__body--flush" style={{ display: 'flex', flexDirection: 'column' }}>
                    {[
                        { label: 'Full name',    value: profile?.name             ?? displayName,  mono: false },
                        { label: 'Email',        value: profile?.email            ?? displayEmail, mono: false },
                        { label: 'Phone',        value: profile?.phone            ?? '—',          mono: true  },
                        { label: 'Timezone',     value: profile?.timezone         ?? '—',          mono: false },
                        { label: 'Member since', value: profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—', mono: true },
                    ].map((row, i) => (
                        <div key={row.label} className="px-4 py-4 flex items-center justify-between gap-4 sm:px-6"
                            style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                            <p className="shrink-0" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{row.label}</p>
                            <p className="min-w-0 text-right break-words" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text)', fontFamily: row.mono ? 'var(--font-mono)' : undefined }}>{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Owned devices — move into an organisation */}
            {ownedDevices.length > 0 && (
                <div>
                    <h2 className="mb-3 uppercase"
                        style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-secondary)' }}>
                        Your devices
                    </h2>
                    <div className="space-y-2">
                        {ownedDevices.map(device => (
                            <div key={device.id} className="tad-card">
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                            {device.name || 'Unnamed device'}
                                        </p>
                                        <p className="truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{device.imei}</p>
                                    </div>
                                    {tenants.length > 0 && (
                                        <button
                                            onClick={() => openMove(device)}
                                            className="tad-btn tad-btn--secondary tad-btn--sm shrink-0 inline-flex items-center gap-1.5"
                                        >
                                            <ArrowRightLeft className="w-3.5 h-3.5" />
                                            Move to organisation
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tenants section */}
            {tenants.length > 0 && (
                <div>
                    <h2 className="mb-3 uppercase"
                        style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-secondary)' }}>
                        Your organisations
                    </h2>
                    <div className="space-y-2">
                        {tenants.map(tenant => (
                            <div key={tenant.id} className="tad-card">
                                <div className="px-4 py-3 flex items-center gap-3">
                                    {tenant.logo_url ? (
                                        <img src={tenant.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0"
                                            style={{ background: 'var(--surface-sunken)', border: '1px solid var(--border)' }} />
                                    ) : (
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: 'linear-gradient(135deg, var(--pak-700), var(--pak-400))', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', fontFamily: 'var(--font-display)' }}>
                                            {tenant.name[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text)' }}>
                                            {tenant.app_name ?? tenant.name}
                                        </p>
                                        <p className="truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>{tenant.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: TENANT_STATUS_DOT[tenant.status] ?? 'var(--text-muted)' }} />
                                        <span className="capitalize" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{tenant.status}</span>
                                        <a href={tenant.portal_url} target="_blank" rel="noopener noreferrer"
                                            className="ml-2 inline-flex items-center gap-1"
                                            style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--brand)' }}>
                                            Open <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tenant request */}
            {showTenantRequest && (
                <div>
                    <div className="rounded-2xl px-5 py-4"
                        style={{ border: '1px solid var(--border)', background: 'var(--brand-subtle)' }}>
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: 'var(--surface)', color: 'var(--brand)' }}>
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--brand-on-subtle)' }}>
                                    Scale up with a tenant account
                                </p>
                                <p className="mt-0.5" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand-on-subtle)' }}>
                                    You have {deviceCount} devices. A dedicated tenant account gives you team access, custom branding, and advanced controls.
                                </p>
                            </div>
                        </div>

                        {reqSuccess ? (
                            <div className="mt-4 rounded-xl px-4 py-3"
                                style={{ fontSize: 'var(--text-sm)', color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)' }}>
                                Request submitted — our team will contact you shortly.
                            </div>
                        ) : !showRequest ? (
                            <button onClick={() => setShowRequest(true)} className="tad-btn tad-btn--primary tad-btn--sm mt-4">
                                Request tenant account
                            </button>
                        ) : (
                            <form onSubmit={submitRequest} className="mt-4 space-y-3">
                                {reqError && (
                                    <div className="rounded-lg px-3 py-2"
                                        style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                        {reqError}
                                    </div>
                                )}
                                <div className="tad-field">
                                    <label className="tad-field__label">
                                        Organisation / company name<span className="tad-field__req">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={e => setOrgName(e.target.value)}
                                        required
                                        placeholder="e.g. City police department"
                                        className="tad-input"
                                    />
                                </div>
                                <div className="tad-field">
                                    <label className="tad-field__label">
                                        Additional notes (optional)
                                    </label>
                                    <textarea
                                        value={reqMessage}
                                        onChange={e => setReqMessage(e.target.value)}
                                        rows={3}
                                        placeholder="Tell us about your use case, team size, or special requirements…"
                                        className="tad-input resize-none"
                                        style={{ height: 'auto', padding: '8px 12px' }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => setShowRequest(false)}
                                        className="tad-btn tad-btn--secondary tad-btn--sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting || !orgName.trim()}
                                        className="tad-btn tad-btn--primary tad-btn--sm">
                                        {submitting ? 'Submitting…' : 'Submit request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Edit CTA */}
            <div className="flex justify-end">
                <Link href="/my/profile/edit" className="tad-btn tad-btn--primary">
                    Edit profile
                </Link>
            </div>

            {/* Move-to-organisation confirm dialog */}
            {moveDevice && (
                <div
                    onClick={() => !moving && setMoveDevice(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="tad-card tad-card--raised"
                        style={{ maxWidth: 460, width: '100%' }}
                    >
                        <div className="tad-card__body space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                                    <AlertTriangle className="w-4.5 h-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)', color: 'var(--text)' }}>
                                        Move to organisation
                                    </p>
                                    <p className="mt-0.5 truncate" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)' }}>
                                        {moveDevice.name || 'Unnamed device'} · {moveDevice.imei}
                                    </p>
                                </div>
                            </div>

                            <div className="tad-field">
                                <label className="tad-field__label" htmlFor="move-tenant">Organisation</label>
                                <div className="tad-select-field">
                                    <select
                                        id="move-tenant"
                                        className="tad-select"
                                        value={moveTenantId}
                                        onChange={e => setMoveTenantId(e.target.value)}
                                        disabled={moving}
                                    >
                                        {tenants.map(t => (
                                            <option key={t.id} value={String(t.id)}>{t.name}</option>
                                        ))}
                                    </select>
                                    <span className="tad-select__chevron">
                                        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-xl px-4 py-3"
                                style={{ fontSize: 'var(--text-sm)', color: 'var(--warning)', background: 'var(--warning-bg)', border: '1px solid color-mix(in srgb, var(--warning) 28%, transparent)', lineHeight: 1.5 }}>
                                You&rsquo;ll lose personal tracking of this device — it will be visible only in{' '}
                                <strong>{moveTargetTenant?.name ?? 'the selected organisation'}</strong>.
                            </div>

                            {moveError && (
                                <div className="rounded-lg px-3 py-2"
                                    style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)' }}>
                                    {moveError}
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setMoveDevice(null)} disabled={moving}
                                    className="tad-btn tad-btn--secondary tad-btn--sm">
                                    Cancel
                                </button>
                                <button type="button" onClick={confirmMove} disabled={moving || !moveTenantId}
                                    className="tad-btn tad-btn--primary tad-btn--sm">
                                    {moving ? 'Moving…' : 'Move device'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
