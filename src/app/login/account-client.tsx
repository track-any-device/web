'use client';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button, OTPInput, Badge } from '@/components/ui';
import { setAuth } from '@/lib/auth-store';

/* SMS-OTP sign-in — posts to the BFF (/api/auth/otp/*) which talks to app and sets the
   httpOnly tad_session cookie. After verify, a brand-new user whose profile is incomplete
   (no date of birth set) must complete their name + DOB before entering the app; everyone
   else lands where they were headed (?next=…, e.g. /checkout) or in their portal by default. */

// Only allow same-origin path redirects (no protocol-relative // or absolute URLs).
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/my';
}

interface VerifiedUser {
  name?: string;
  profile_complete?: boolean;
}

export function AccountClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [step, setStep] = React.useState<'phone' | 'otp' | 'profile' | 'done'>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Profile-completion step state.
  const [token, setToken] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [dob, setDob] = React.useState('');

  // Date input bounds: must be in the past, and not before a sane floor.
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function requestOtp() {
    if (!phone.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.errors?.phone?.[0] ?? d?.message ?? 'Could not send the code. Check your number.');
        return;
      }
      setStep('otp'); setCode('');
    } catch { setError('Network error. Please try again.'); }
    finally { setBusy(false); }
  }

  async function verifyOtp(otp: string) {
    if (otp.length !== 6 || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.errors?.otp?.[0] ?? d?.message ?? 'Invalid or expired code.');
        return;
      }
      // Populate the client auth-store so the /my shell (useAuth/localStorage) recognises the
      // session and its API calls carry the Bearer token. The httpOnly cookie is set by the BFF.
      const data = await res.json().catch(() => ({}));
      if (data?.token) setAuth(data.token, data.user);

      const user: VerifiedUser = data?.user ?? {};
      // Incomplete profile (no DOB yet) → collect name + DOB before entering the app.
      if (user.profile_complete === false) {
        setToken(data?.token ?? null);
        // Prefill the real name; ignore the 'TAD user' placeholder a fresh OTP user starts with.
        setName(user.name && user.name !== 'TAD user' ? user.name : '');
        setStep('profile');
        return;
      }
      setStep('done');
      window.location.assign(next);
    } catch { setError('Network error. Please try again.'); }
    finally { setBusy(false); }
  }

  async function submitProfile() {
    if (busy) return;
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Please enter your full name.'); return; }
    if (!dob) { setError('Please enter your date of birth.'); return; }
    if (dob >= today) { setError('Date of birth must be in the past.'); return; }

    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/my/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: trimmedName, date_of_birth: dob }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(
          d?.errors?.date_of_birth?.[0]
          ?? d?.errors?.name?.[0]
          ?? d?.message
          ?? 'Could not save your details. Please try again.',
        );
        return;
      }
      // Refresh the stored user so the portal sees the completed profile.
      const updated = await res.json().catch(() => ({}));
      if (token) setAuth(token, updated);
      setStep('done');
      window.location.assign(next);
    } catch { setError('Network error. Please try again.'); }
    finally { setBusy(false); }
  }

  if (step === 'done') {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', placeItems: 'center', textAlign: 'center' }}>
        <Badge variant="success" dot>Verified</Badge>
        <p style={{ color: 'var(--text-secondary)' }}>You&apos;re signed in. Taking you to your devices…</p>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <form onSubmit={(e) => { e.preventDefault(); submitProfile(); }} style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-2)', textAlign: 'center' }}>
          <Badge variant="success" dot>Phone verified</Badge>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Just one more step — tell us your name and date of birth to finish setting up your account.
          </p>
        </div>
        <Input
          label="Full name"
          required
          autoFocus
          placeholder="e.g. Ayesha Khan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Date of birth"
          type="date"
          required
          max={today}
          min="1900-01-01"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          hint="You must be the account holder."
        />
        {error && <p style={{ color: 'var(--danger, #dc2626)', fontSize: 'var(--text-sm)' }}>{error}</p>}
        <Button type="submit" block size="lg" disabled={busy}>{busy ? 'Saving…' : 'Finish & continue'}</Button>
      </form>
    );
  }

  if (step === 'otp') {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-5)', justifyItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
          We sent a 6-digit code to <span className="tad-data">{phone || 'your phone'}</span>.
        </p>
        <OTPInput value={code} onChange={setCode} onComplete={verifyOtp} autoFocus />
        {error && <p style={{ color: 'var(--danger, #dc2626)', fontSize: 'var(--text-sm)' }}>{error}</p>}
        <Button block disabled={busy} onClick={() => verifyOtp(code)}>{busy ? 'Verifying…' : 'Verify & continue'}</Button>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <button className="tad-btn tad-btn--ghost tad-btn--sm" onClick={() => { setStep('phone'); setError(null); }}>Change number</button>
          <button className="tad-btn tad-btn--ghost tad-btn--sm" disabled={busy} onClick={requestOtp}>Resend code</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); requestOtp(); }} style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Input
        label="Phone number"
        mono
        required
        placeholder="03xx xxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="We'll text you a one-time code to sign in."
      />
      {error && <p style={{ color: 'var(--danger, #dc2626)', fontSize: 'var(--text-sm)' }}>{error}</p>}
      <Button type="submit" block size="lg" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</Button>
    </form>
  );
}
