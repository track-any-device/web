import { NextRequest, NextResponse } from 'next/server'
import {
    exchangeCodeForToken,
    getUserInfo,
    SESSION_COOKIE,
    STATE_COOKIE,
    encodeSession,
} from '@/lib/auth'

export const runtime = 'edge'

const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com'
const REDIRECT_COOKIE = 'tad_redirect'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(
            new URL(`/auth/error?error=${encodeURIComponent(error)}`, APP_URL),
        )
    }

    if (!code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) {
        return NextResponse.redirect(new URL('/auth/error?error=InvalidState', APP_URL))
    }

    const tokenData = await exchangeCodeForToken(code)
    if (!tokenData?.access_token) {
        return NextResponse.redirect(new URL('/auth/error?error=TokenExchange', APP_URL))
    }

    const user   = await getUserInfo(tokenData.access_token)
    const maxAge = tokenData.expires_in ?? 86_400
    const intendedPath = req.cookies.get(REDIRECT_COOKIE)?.value ?? '/my'

    const res = NextResponse.redirect(new URL(intendedPath, APP_URL))
    res.cookies.delete(STATE_COOKIE)
    res.cookies.delete(REDIRECT_COOKIE)

    // HTTP-only session cookie — token never exposed to JavaScript
    res.cookies.set(
        SESSION_COOKIE,
        encodeSession({ token: tokenData.access_token, user: user ?? undefined }),
        {
            httpOnly: true,
            secure:   true,
            sameSite: 'lax',
            maxAge,
            path:     '/',
        },
    )

    return res
}
