import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE  = 'tad_session';
const REDIRECT_COOKIE = 'tad_redirect';

// Paths under /my require authentication.
// All other paths are public (marketing site, docs, GraphQL content).
export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (!pathname.startsWith('/my')) {
        return NextResponse.next();
    }

    const session = req.cookies.get(SESSION_COOKIE);
    if (session) {
        return NextResponse.next();
    }

    // Store the intended URL so the SSO callback can redirect back after login.
    const loginUrl = new URL('/api/auth/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set(REDIRECT_COOKIE, pathname, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge:   300,
        path:     '/',
    });
    return response;
}

export const config = {
    matcher: ['/my/:path*'],
};
