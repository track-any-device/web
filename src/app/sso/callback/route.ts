import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getUserInfo, SESSION_COOKIE, STATE_COOKIE, encodeSession } from '@/lib/auth';

export const runtime = 'edge';

const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com';
const REDIRECT_COOKIE = 'tad_redirect';

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

    // Redirect to the intended URL stored by middleware before the login redirect,
    // or fall back to the "my" dashboard.
    const intendedPath = req.cookies.get(REDIRECT_COOKIE)?.value ?? '/my';
    const res = NextResponse.redirect(new URL(intendedPath, APP_URL));

    const maxAge  = tokenData.expires_in ?? 86400;
    const secure  = process.env.NODE_ENV === 'production';

    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(REDIRECT_COOKIE);

    // HTTP-only session cookie — read by server components via getSession()
    res.cookies.set(SESSION_COOKIE, encodeSession({ token: tokenData.access_token, user: user ?? undefined }), {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge,
        path:     '/',
    });

    // Readable token cookie — bootstraps sessionStorage for client components.
    // Not httpOnly so JS can read it; cleared by TokenInit after copying to sessionStorage.
    res.cookies.set('tad_token', tokenData.access_token, {
        httpOnly: false,
        secure,
        sameSite: 'lax',
        maxAge,
        path:     '/',
    });

    return res;
}
