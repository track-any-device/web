import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: update an exclusion zone (Admin/Core). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/admin/exclusion-beats/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

/** BFF: delete an exclusion zone (Admin/Core). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })
  const { id } = await params
  const res = await fetch(`${API_URL}/api/admin/exclusion-beats/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
