import { NextRequest, NextResponse } from 'next/server'

const REDIRECT_COOKIE = 'tad_redirect'

export function middleware(req: NextRequest) {
    const res = NextResponse.redirect(new URL('/api/auth/login', req.url))
    res.cookies.set(REDIRECT_COOKIE, req.nextUrl.pathname, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   300,
        path:     '/',
    })
    return res
}

export const config = {
    matcher: [],
}
