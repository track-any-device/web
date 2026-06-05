import { NextRequest } from 'next/server'
import {
    exchangeCodeForToken,
    getUserInfo,
    STATE_COOKIE,
    SESSION_COOKIE,
} from '@/lib/auth'

export const runtime = 'edge'

const REDIRECT_COOKIE = 'tad_redirect'

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://track-any-device.com'

    if (error) {
        return redirect(`${appUrl}/auth/error?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) {
        return redirect(`${appUrl}/auth/error?error=InvalidState`)
    }

    const tokenData = await exchangeCodeForToken(code)
    if (!tokenData?.access_token) {
        return redirect(`${appUrl}/auth/error?error=TokenExchange`)
    }

    const user         = await getUserInfo(tokenData.access_token)
    const intendedPath = req.cookies.get(REDIRECT_COOKIE)?.value ?? '/my'

    const payload = JSON.stringify({
        token: tokenData.access_token,
        user:  user ?? null,
    }).replace(/</g, '\\u003c')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body><p style="font-family:system-ui;color:#666;text-align:center;margin-top:40vh">Signing in…</p>
<script>
try{var d=${JSON.stringify(payload)};var p=JSON.parse(d);
localStorage.setItem('tad_token',p.token);
if(p.user)localStorage.setItem('tad_user',JSON.stringify(p.user));
}catch(e){console.error(e)}
location.replace(${JSON.stringify(intendedPath)});
</script></body></html>`

    const res = new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' },
    })
    res.headers.append('Set-Cookie', `${STATE_COOKIE}=; Path=/; Max-Age=0`)
    res.headers.append('Set-Cookie', `${REDIRECT_COOKIE}=; Path=/; Max-Age=0`)
    res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0`)
    return res
}

function redirect(url: string) {
    return Response.redirect(url, 302)
}
