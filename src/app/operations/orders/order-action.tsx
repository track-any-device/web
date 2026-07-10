'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

// Simple forward transitions (no extra input). Shipping (needs tracking) is handled separately.
const NEXT: Record<string, { label: string; status: 'confirmed' | 'delivered' } | undefined> = {
  pending: { label: 'Confirm', status: 'confirmed' },
  shipped: { label: 'Mark delivered', status: 'delivered' },
}

// Confirmed orders are shipped next — that step captures tracking details.
const CAN_SHIP = new Set(['confirmed'])
// Anything not yet delivered or already cancelled can still be declined.
const CAN_DECLINE = new Set(['pending', 'confirmed', 'shipped'])

type Mode = 'idle' | 'ship' | 'decline'

/** Advances a delivery order via the ops BFF — confirm, ship (with tracking details), deliver, or
    decline (with a reason). Tracking + reason are stored by the API and texted to the customer. */
export function OrderAction({ orderId, status }: { orderId?: number; status: string | null }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const [reason, setReason] = useState('')
  const [courier, setCourier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const next = NEXT[status ?? '']
  const canShip = CAN_SHIP.has(status ?? '')
  const canDecline = CAN_DECLINE.has(status ?? '')

  if (orderId == null || (!next && !canShip && !canDecline)) {
    return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
  }

  const post = async (body: Record<string, string>) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/ops/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.message ?? 'Could not update the order.')
        return
      }
      setMode('idle')
      setReason(''); setCourier(''); setTrackingNumber(''); setTrackingUrl('')
      startTransition(() => router.refresh())
    } catch {
      setError('Network error — please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'ship') {
    return (
      <div style={{ display: 'grid', gap: 6, minWidth: 240, justifyItems: 'stretch' }}>
        <Input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier (e.g. TCS, Leopards)" autoFocus />
        <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" />
        <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Tracking URL (optional)" />
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => post({ status: 'shipped', tracking_courier: courier.trim(), tracking_number: trackingNumber.trim(), tracking_url: trackingUrl.trim() })}
            disabled={saving || pending || !courier.trim() || !trackingNumber.trim()}
          >
            {saving ? '…' : 'Mark shipped'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setMode('idle'); setError(null) }} disabled={saving}>Cancel</Button>
        </div>
        {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
      </div>
    )
  }

  if (mode === 'decline') {
    return (
      <div style={{ display: 'grid', gap: 6, minWidth: 220, justifyItems: 'end' }}>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (sent to the customer by SMS)"
          rows={2}
          autoFocus
          style={{ width: '100%', fontSize: 13, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <Button variant="danger" size="sm" onClick={() => post({ status: 'cancelled', reason: reason.trim() })} disabled={saving || pending || !reason.trim()}>
            {saving ? '…' : 'Decline order'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setMode('idle'); setError(null) }} disabled={saving}>Keep</Button>
        </div>
        {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
      </div>
    )
  }

  return (
    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {next && (
        <Button variant="secondary" size="sm" onClick={() => post({ status: next.status })} disabled={saving || pending}>
          {saving || pending ? '…' : next.label}
        </Button>
      )}
      {canShip && (
        <Button variant="secondary" size="sm" onClick={() => setMode('ship')} disabled={saving || pending}>
          Mark shipped
        </Button>
      )}
      {canDecline && (
        <Button variant="ghost" size="sm" onClick={() => setMode('decline')} disabled={saving || pending}>
          Decline
        </Button>
      )}
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </div>
  )
}
