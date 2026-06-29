import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: list an organisation's members (Admin/Core). Proxies to app with the caller's Sanctum token. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const res = await fetch(`${API_URL}/api/admin/tenants/${id}/members`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

/** BFF: add a member to the organisation (Admin/Core). Idempotent in the app — adding an existing
 *  member is a no-op success. Returns the added member row. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/admin/tenants/${id}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ user_id: body.user_id }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
