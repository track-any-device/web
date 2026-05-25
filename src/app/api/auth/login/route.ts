import { NextResponse } from 'next/server';
import { buildAuthorizationUrl, STATE_COOKIE } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET() {
  const state = randomBytes(16).toString('hex');
  const url   = buildAuthorizationUrl(state);

  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   300,
    path:     '/',
  });
  return res;
}
