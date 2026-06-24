import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: read a device's telemetry trail (lat/lng/speed/battery over `hours`) for the admin
 *  device detail activity graphs (Admin/Core). Mirrors the upstream response shape:
 *  { deviceId, hours, points:[{lat,lng,t,speed,battery}], count }. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  const { id } = await params

  // Pass through the requested window (default 24h); clamp to a sane integer.
  const raw = Number(req.nextUrl.searchParams.get('hours'))
  const hours = Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 24 * 30) : 24

  const res = await fetch(`${API_URL}/api/admin/devices/${id}/trail?hours=${hours}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
