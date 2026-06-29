import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: remove a member from the organisation (Admin/Core). Proxies the DELETE to the app. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; user: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const { id, user } = await params
  const res = await fetch(`${API_URL}/api/admin/tenants/${id}/members/${user}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
