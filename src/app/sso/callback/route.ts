import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo, SESSION_COOKIE, STATE_COOKIE, encodeSession } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?sso_error=${encodeURIComponent(error)}`, APP_URL));
  }

  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/?sso_error=invalid_state', APP_URL));
  }

  const tokenData = await exchangeCodeForToken(code);
  if (!tokenData?.access_token) {
    return NextResponse.redirect(new URL('/?sso_error=token_exchange_failed', APP_URL));
  }

  const user = await getUserInfo(tokenData.access_token);

  const res = NextResponse.redirect(new URL('/', APP_URL));

  res.cookies.delete(STATE_COOKIE);
  res.cookies.set(SESSION_COOKIE, encodeSession({ token: tokenData.access_token, user: user ?? undefined }), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   tokenData.expires_in ?? 86400,
    path:     '/',
  });

  return res;
}
