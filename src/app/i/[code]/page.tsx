import React from 'react';
import { SilenceClient } from './silence-client';

export const runtime = 'edge';

export const metadata = { title: 'Incident · Track Any Device' };

export default async function PublicIncidentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SilenceClient code={code} />;
}
