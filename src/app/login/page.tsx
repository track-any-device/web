import React, { Suspense } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/tad/auth-layout';
import { AccountClient } from './account-client';

/* Account sign-in surface (PREVIEW at /tad-preview/account) — SMS-OTP flow. */

export default function AccountPreview() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Track your car, bike, and team — sign in with your phone."
      footer={<>New to TAD-PAK? <Link href="/shop" className="tad-foot-link" style={{ display: 'inline' }}>Get a tracker</Link></>}
    >
      {/* Suspense boundary: AccountClient reads ?next via useSearchParams. */}
      <Suspense fallback={null}>
        <AccountClient />
      </Suspense>
    </AuthLayout>
  );
}
