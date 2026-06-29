import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: list platform users (Admin/Core). Used client-side by the org member picker to search and
 *  select an existing user to add to an organisation. Proxies to app with the caller's Sanctum token. */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const res = await fetch(`${API_URL}/api/admin/users`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
