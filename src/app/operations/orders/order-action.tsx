'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

const NEXT: Record<string, { label: string; status: 'confirmed' | 'delivered' } | undefined> = {
  pending: { label: 'Confirm', status: 'confirmed' },
  confirmed: { label: 'Mark delivered', status: 'delivered' },
}

/** Advances a delivery order to its next status via the ops BFF, then refreshes the board. */
export function OrderAction({ orderId, status }: { orderId?: number; status: string | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const next = NEXT[status ?? '']

  if (!next || orderId == null) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
  }

  const onClick = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/ops/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next.status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d?.message ?? 'Could not update the order.')
        return
      }
      startTransition(() => router.refresh())
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={saving || pending}>
      {saving || pending ? '…' : next.label}
    </Button>
  )
}
