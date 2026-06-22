'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, OTPInput, Badge } from '@/components/ui';
import { setAuth } from '@/lib/auth-store';

/* SMS-OTP sign-in — posts to the BFF (/api/auth/otp/*) which talks to app and sets the
   httpOnly tad_session cookie. On success, lands the user in their portal. */

export function AccountClient() {
  const router = useRouter();
  const [step, setStep] = React.useState<'phone' | 'otp' | 'done'>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

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
      setStep('done');
      window.location.assign('/my');
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
