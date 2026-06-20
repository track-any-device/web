'use client';
import React from 'react';
import Link from 'next/link';
import { Input, Button, OTPInput, Badge } from '@/components/ui';

/* SMS-OTP sign-in flow (preview). UI only — wire to server-login's OTP via the BFF in Phase 5b.
   (Auth architecture — SSO redirect vs in-app OTP — is decision 5a; this previews the in-app UI.) */

export function AccountClient() {
  const [step, setStep] = React.useState<'phone' | 'otp' | 'done'>('phone');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');

  if (step === 'done') {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-3)', placeItems: 'center', textAlign: 'center' }}>
        <Badge variant="success" dot>Verified</Badge>
        <p style={{ color: 'var(--text-secondary)' }}>You&apos;re signed in. Taking you to your devices…</p>
        <Link href="/tad-preview/portal" className="tad-btn tad-btn--primary tad-btn--block">Go to my things</Link>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div style={{ display: 'grid', gap: 'var(--space-5)', justifyItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
          We sent a 6-digit code to <span className="tad-data">{phone || 'your phone'}</span>.
        </p>
        <OTPInput value={code} onChange={setCode} onComplete={() => setStep('done')} autoFocus />
        <Button block onClick={() => code.length === 6 && setStep('done')}>Verify &amp; continue</Button>
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <button className="tad-btn tad-btn--ghost tad-btn--sm" onClick={() => setStep('phone')}>Change number</button>
          <button className="tad-btn tad-btn--ghost tad-btn--sm" onClick={() => setCode('')}>Resend code</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (phone.trim()) setStep('otp'); }} style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <Input
        label="Phone number"
        mono
        required
        placeholder="03xx xxxxxxx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        hint="We'll text you a one-time code to sign in."
      />
      <Button type="submit" block size="lg">Send code</Button>
    </form>
  );
}
