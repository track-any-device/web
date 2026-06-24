import React from 'react';
import type { Metadata } from 'next';
import { SilenceClient } from './silence-client';
import { staticMapUrl } from './static-map';

export const runtime = 'edge';

/* Page metadata is built from the incident so a shared SMS link previews with a map of the incident
   pin + the device's current location. Falls back to a generic title if the link is invalid. */
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const fallback: Metadata = { title: 'Incident · Track Any Device' };
  try {
    const res = await fetch(`${process.env.API_URL}/api/public/incidents/${code}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return fallback;
    const d = await res.json();
    const title = `${d.label ?? 'Incident'}${d.device?.name ? ` · ${d.device.name}` : ''} · Track Any Device`;
    const description = d.triggeredAt
      ? `Alert triggered ${new Date(d.triggeredAt).toLocaleString()}. Tap to view the location and silence reminders.`
      : 'Live incident on Track Any Device — view the location and silence reminders.';
    const img = staticMapUrl({ lat: d.lat, lng: d.lng, deviceLat: d.deviceLat, deviceLng: d.deviceLng, size: '600x315' });
    return {
      title,
      description,
      openGraph: { title, description, images: img ? [{ url: img, width: 1200, height: 630 }] : [] },
      twitter: { card: img ? 'summary_large_image' : 'summary', title, description, images: img ? [img] : [] },
    };
  } catch {
    return fallback;
  }
}

export default async function PublicIncidentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <SilenceClient code={code} />;
}
