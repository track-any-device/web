import { NextResponse } from 'next/server';
import { buildAuthorizationUrl, STATE_COOKIE } from '@/lib/auth';

export const runtime = 'edge';

export async function GET() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
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
