import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: take a support ticket (Admin/Core) — assigns it to the caller and moves it to in progress. */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  const { id } = await params
  const res = await fetch(`${API_URL}/api/ops/support/tickets/${id}/assign`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
