import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: create a tenant (Admin/Core). Proxies to app with the caller's Sanctum token.
 *  The response includes the plain access key — shown to the operator once. */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/admin/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({ name: body.name }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
