import { SESSION_COOKIE } from '@/lib/auth'

export const runtime = 'edge'

export async function GET() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script>
try{localStorage.removeItem('tad_token');localStorage.removeItem('tad_user')}catch(e){}
location.replace('/');
</script></body></html>`

    const res = new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'no-store' },
    })
    res.headers.append('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0`)
    return res
}
