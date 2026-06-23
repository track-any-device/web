import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { requirePortal } from '@/lib/portal-guard';
import { type SupportTicket } from '@/lib/portal-data';
import { SupportBoard } from './support-board-client';

export default async function SupportPage() {
  await requirePortal('support');
  const { data: tickets, error } = await fetchPortal<SupportTicket>('/ops/support/tickets');
  return (
    <>
      <PortalTopbar title="Support — Ticket board" subtitle="Triage incident tickets across all customers" />
      <div className="tad-portal__body">
        <SupportBoard initial={tickets} loadError={error} />
      </div>
    </>
  );
}
