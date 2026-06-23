import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: register an incoming device by IMEI (Procurement). Proxies to app with the caller's Sanctum token. */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/ops/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ imei: body.imei, device_type_id: body.device_type_id }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
