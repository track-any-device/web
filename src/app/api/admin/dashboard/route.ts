import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: admin dashboard aggregation (Admin/Core). Proxies to app with the caller's
   Sanctum token, passing through the `days` query param (clamped server-side by app). */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const raw = Number(req.nextUrl.searchParams.get('days') ?? 30)
  const days = Number.isFinite(raw) ? Math.min(90, Math.max(7, Math.trunc(raw))) : 30

  const res = await fetch(`${API_URL}/api/admin/dashboard?days=${days}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
