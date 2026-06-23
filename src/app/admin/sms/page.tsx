import React from 'react';
import { PortalTopbar } from '@/components/tad/portal-shell';
import { fetchPortal } from '@/lib/admin-api';
import { type OutgoingSmsRow, type IncomingSmsRow } from '@/lib/portal-data';
import { SmsClient } from './sms-client';

export default async function AdminSmsPage() {
  const [out, inc] = await Promise.all([
    fetchPortal<OutgoingSmsRow>('/admin/sms/outgoing'),
    fetchPortal<IncomingSmsRow>('/admin/sms/incoming'),
  ]);
  return (
    <>
      <PortalTopbar title="SMS" subtitle="Inbound and outbound messages" />
      <SmsClient outgoing={out.data} incoming={inc.data} outError={out.error} inError={inc.error} />
    </>
  );
}
