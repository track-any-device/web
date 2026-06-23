import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'edge'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'https://api.track-any-device.com'

/** BFF: provision a device (Workshop) — set SIM/GSM numbers, broadcast id, name. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.token) return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/ops/devices/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify({
      sim_number: body.sim_number,
      gsm_number: body.gsm_number,
      broadcast_id: body.broadcast_id,
      name: body.name,
    }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
