/* Builds a Google Static Maps URL for the public incident page — a red "I" pin at the incident
   trigger location and (when known) a green "D" pin at the device's current position. Used both for
   the page's embedded map and the OG preview image, so a shared SMS link shows a map. Returns null
   when there's no key or no incident coordinate (caller falls back gracefully — never a guess). */

export function staticMapUrl(opts: {
  lat: number | null;
  lng: number | null;
  deviceLat?: number | null;
  deviceLng?: number | null;
  size?: string;
}): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || opts.lat == null || opts.lng == null) return null;

  const markers = [`markers=${encodeURIComponent(`color:red|label:I|${opts.lat},${opts.lng}`)}`];
  const hasDevice = opts.deviceLat != null && opts.deviceLng != null;
  if (hasDevice) {
    markers.push(`markers=${encodeURIComponent(`color:0x1F9462|label:D|${opts.deviceLat},${opts.deviceLng}`)}`);
  }

  const base = `https://maps.googleapis.com/maps/api/staticmap?size=${opts.size ?? '640x320'}&scale=2&${markers.join('&')}&key=${key}`;
  // Two markers auto-fit; a single marker needs an explicit center + zoom.
  return hasDevice ? base : `${base}&center=${opts.lat},${opts.lng}&zoom=15`;
}
