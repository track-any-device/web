import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: list device types (for the Procurement add-device picker). */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const res = await fetch(`${API_URL}/api/ops/device-types`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ([]))
  return NextResponse.json(data, { status: res.status })
}
