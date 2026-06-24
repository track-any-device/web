'use client';

import React from 'react';
import { Badge, Button, Input, Card } from '@/components/ui';
import type { BadgeVariant } from '@/components/ui';
import type { SupportTicket, SupportTicketComment } from '@/lib/portal-data';

/* Support ticketing Kanban.
   Four columns by status (open / in_progress / scheduled / closed). Each card shows the
   incident's priority + event, the device, the customer, a map link, assignee and comment count.
   Open cards can be taken (POST assign → moves to In progress); any non-closed card opens a
   detail modal where you can comment, close, or schedule a call-back. Every mutation updates the
   board state in place (moving the card between columns / bumping the comment count). */

type Status = 'open' | 'in_progress' | 'scheduled' | 'closed';

const COLUMNS: { status: Status; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'closed', label: 'Closed' },
];

const EVENT_LABEL: Record<string, string> = {
  sos: 'SOS',
  overspeed: 'Overspeed',
  low_battery: 'Low battery',
  beat_violation: 'Zone breach',
  device_offline: 'Device offline',
};

function humanizeEvent(t: string | null): string {
  if (!t) return '—';
  if (EVENT_LABEL[t]) return EVENT_LABEL[t];
  // Fallback: sentence-case the snake_case event.
  const spaced = t.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function priorityVariant(p: string | null): BadgeVariant {
  if (p === 'critical') return 'danger';
  if (p === 'high') return 'warning';
  return 'neutral';
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const abs = Math.abs(diff);
  const min = 60_000, hr = 3_600_000, day = 86_400_000;
  const future = diff < 0;
  let text: string;
  if (abs < min) text = 'just now';
  else if (abs < hr) text = `${Math.round(abs / min)}m`;
  else if (abs < day) text = `${Math.round(abs / hr)}h`;
  else text = `${Math.round(abs / day)}d`;
  if (text === 'just now') return text;
  return future ? `in ${text}` : `${text} ago`;
}

function mapsUrl(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export function SupportBoard({ initial, loadError }: { initial: SupportTicket[]; loadError: string | null }) {
  const [tickets, setTickets] = React.useState<SupportTicket[]>(initial);
  const [openId, setOpenId] = React.useState<string | number | null>(null);

  React.useEffect(() => { setTickets(initial); }, [initial]);

  // Apply a ticket update everywhere it matters (board + open modal stay in sync).
  const applyUpdate = React.useCallback((id: string | number, patch: Partial<SupportTicket>) => {
    setTickets((rows) => rows.map((t) => (String(t.id) === String(id) ? { ...t, ...patch } : t)));
  }, []);

  const byStatus = (status: Status) => tickets.filter((t) => t.status === status);
  const openTicket = tickets.find((t) => String(t.id) === String(openId)) ?? null;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(280px, 1fr)',
          gap: 'var(--space-4)',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {COLUMNS.map((col) => {
          const rows = byStatus(col.status);
          return (
            <section
              key={col.status}
              className="tad-card"
              style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 220px)' }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                  borderTop: `3px solid ${col.status === 'closed' ? 'var(--border)' : 'var(--brand)'}`,
                }}
              >
                <span>{col.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{rows.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-3)', overflowY: 'auto' }}>
                {rows.length === 0 ? (
                  <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                    {col.status === 'open' && loadError ? loadError : 'Nothing here.'}
                  </div>
                ) : (
                  rows.map((t) => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      onTaken={(updated) => applyUpdate(t.id, updated)}
                      onOpen={() => setOpenId(t.id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {openTicket && (
        <TicketModal
          ticket={openTicket}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) => applyUpdate(openTicket.id, patch)}
        />
      )}
    </>
  );
}

function TicketCard({
  ticket,
  onTaken,
  onOpen,
}: {
  ticket: SupportTicket;
  onTaken: (patch: Partial<SupportTicket>) => void;
  onOpen: () => void;
}) {
  const [taking, setTaking] = React.useState(false);
  const maps = mapsUrl(ticket.lat, ticket.lng);

  async function take() {
    if (taking) return;
    setTaking(true);
    try {
      const res = await fetch(`/api/ops/support/tickets/${ticket.id}/assign`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data?.message ?? 'Could not take this ticket.');
        return;
      }
      onTaken(data as SupportTicket);
    } catch {
      window.alert('Network error — please try again.');
    } finally {
      setTaking(false);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        background: 'var(--surface, #fff)', padding: 'var(--space-3)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority ?? 'normal'}</Badge>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{relativeTime(ticket.triggeredAt)}</span>
      </div>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
        {ticket.label ?? humanizeEvent(ticket.eventType)}
      </div>

      {/* Device */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{ticket.device?.name ?? 'Unknown device'}</span>
        {ticket.device?.imei && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{ticket.device.imei}</span>
        )}
      </div>

      {/* Customer */}
      {ticket.customer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13, color: 'var(--text)' }}>{ticket.customer.name ?? 'Unknown customer'}</span>
          {ticket.customer.phone && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{ticket.customer.phone}</span>
          )}
        </div>
      )}

      {maps && (
        <a href={maps} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}>
          View location
        </a>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{ticket.assignee?.name ?? 'Unassigned'}</span>
        <span>{ticket.commentsCount} {ticket.commentsCount === 1 ? 'comment' : 'comments'}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        {ticket.status === 'open' && (
          <Button size="sm" loading={taking} disabled={taking} onClick={take}>Take</Button>
        )}
        {ticket.status !== 'closed' && (
          <Button variant="ghost" size="sm" onClick={onOpen}>Open</Button>
        )}
      </div>
    </div>
  );
}

type Notice = { kind: 'success' | 'error'; text: string };

function TicketModal({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onUpdate: (patch: Partial<SupportTicket>) => void;
}) {
  const [detail, setDetail] = React.useState<SupportTicket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<SupportTicketComment[]>([]);

  const [comment, setComment] = React.useState('');
  const [posting, setPosting] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);
  const [scheduledFor, setScheduledFor] = React.useState('');
  const [notice, setNotice] = React.useState<Notice | null>(null);

  // Source of truth inside the modal: the freshly-loaded detail, falling back to the board row.
  const view = detail ?? ticket;
  const maps = mapsUrl(view.lat, view.lng);

  React.useEffect(() => {
    let live = true;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const res = await fetch(`/api/ops/support/tickets/${ticket.id}`, { headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!live) return;
        if (!res.ok) {
          setLoadError(data?.message ?? 'Could not load this ticket.');
          return;
        }
        setDetail(data as SupportTicket);
        setComments(Array.isArray(data?.comments) ? (data.comments as SupportTicketComment[]) : []);
      } catch {
        if (live) setLoadError('Could not load this ticket.');
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, [ticket.id]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || posting) return;
    setPosting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ops/support/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', text: data?.message ?? 'Could not add the comment.' });
        return;
      }
      const next = [...comments, data as SupportTicketComment];
      setComments(next);
      setComment('');
      setDetail((d) => (d ? { ...d, commentsCount: next.length } : d));
      onUpdate({ commentsCount: next.length });
    } catch {
      setNotice({ kind: 'error', text: 'Network error — please try again.' });
    } finally {
      setPosting(false);
    }
  }

  async function patch(body: { status: string; scheduled_for?: string }) {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ops/support/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({ kind: 'error', text: data?.message ?? 'Could not update the ticket.' });
        return false;
      }
      setDetail(data as SupportTicket);
      onUpdate(data as SupportTicket);
      return true;
    } catch {
      setNotice({ kind: 'error', text: 'Network error — please try again.' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    const ok = await patch({ status: 'closed' });
    if (ok) onClose();
  }

  async function schedule() {
    if (!scheduledFor) {
      setNotice({ kind: 'error', text: 'Pick a date and time first.' });
      return;
    }
    const iso = new Date(scheduledFor).toISOString();
    const ok = await patch({ status: 'scheduled', scheduled_for: iso });
    if (ok) {
      setScheduling(false);
      setNotice({ kind: 'success', text: 'Call-back scheduled.' });
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}
    >
      <Card
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        style={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Badge variant={priorityVariant(view.priority)}>{view.priority ?? 'normal'}</Badge>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>{view.label ?? humanizeEvent(view.eventType)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Triggered {relativeTime(view.triggeredAt)}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Details — two columns on larger phones+, single column at the narrowest widths. */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" style={{ marginBottom: 14 }}>
          <DetailField label="Device" value={view.device?.name ?? 'Unknown device'} sub={view.device?.imei ?? undefined} />
          <DetailField label="Customer" value={view.customer?.name ?? 'Unknown'} sub={view.customer?.phone ?? undefined} />
          <DetailField label="Assignee" value={view.assignee?.name ?? 'Unassigned'} />
          <DetailField
            label="Location"
            value={maps ? '' : 'No location'}
            link={maps ? { href: maps, text: 'View on map' } : undefined}
          />
        </div>
        {view.scheduledFor && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Call-back scheduled for <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{new Date(view.scheduledFor).toLocaleString()}</span>
          </div>
        )}

        {/* Comment thread */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Comments</div>
        {loading ? (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : loadError ? (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--danger)' }}>{loadError}</div>
        ) : comments.length === 0 ? (
          <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No comments yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {comments.map((c) => (
              <div key={c.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.user ?? 'Staff'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{relativeTime(c.at)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{c.body}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <form onSubmit={addComment} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Add comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Note an action or update…"
            />
          </div>
          <Button type="submit" loading={posting} disabled={posting || !comment.trim()}>Post</Button>
        </form>

        {/* Footer actions */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scheduling && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Call-back time"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              </div>
              <Button onClick={schedule} loading={busy} disabled={busy}>Confirm</Button>
              <Button variant="ghost" onClick={() => setScheduling(false)}>Cancel</Button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {view.status !== 'closed' && (
              <>
                <Button variant="danger" onClick={close} loading={busy && !scheduling} disabled={busy}>Close ticket</Button>
                {!scheduling && (
                  <Button variant="secondary" onClick={() => { setScheduling(true); setNotice(null); }}>Schedule call</Button>
                )}
              </>
            )}
            {notice && (
              <span style={{ fontSize: 13, color: notice.kind === 'success' ? 'var(--success)' : 'var(--danger)' }}>{notice.text}</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function DetailField({ label, value, sub, link }: { label: string; value: string; sub?: string; link?: { href: string; text: string } }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      {link ? (
        <a href={link.href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none' }}>{link.text}</a>
      ) : (
        <>
          {value && <div style={{ fontSize: 13, color: 'var(--text)' }}>{value}</div>}
          {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
        </>
      )}
    </div>
  );
}
