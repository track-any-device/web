import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: bulk device mutation — explicit ids (sync) or filter mode (queued). Admin/Core. */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/admin/devices/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
