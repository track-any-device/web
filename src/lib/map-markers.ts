/* Device map-marker helpers — ported from the retired ui-kit (@trackany-device/components).
   Signal strength (0–100) → marker colour; arrow images live in /public/map-arrows/. */

export type MarkerColor = 'red' | 'purple' | 'blue' | 'green';

type Signal = number | null | undefined;
type Heading = number | null | undefined;

/** 0–100 signal → marker colour (none/low→red, above-low→purple, average→blue, good→green). */
export function markerColor(signal: Signal): MarkerColor {
  if (signal == null || signal <= 25) return 'red';
  if (signal <= 50) return 'purple';
  if (signal <= 75) return 'blue';
  return 'green';
}

const ARROW_URLS: Record<MarkerColor, string> = {
  red: '/map-arrows/map-arrow-red.png',
  purple: '/map-arrows/map-arrow-purple.png',
  blue: '/map-arrows/map-arrow-blue.png',
  green: '/map-arrows/map-arrow-green.png',
};

const PIN_COLORS: Record<MarkerColor, string> = {
  red: '#ef4444',
  purple: '#a855f7',
  blue: '#3b82f6',
  green: '#22c55e',
};

/** Show a directional arrow when the device reports a heading; otherwise a static pin. */
export function useArrow(heading: Heading): boolean {
  return heading != null;
}

/** CSS transform for a north-pointing arrow image (deg clockwise from north). */
export function arrowRotation(heading: Heading): string {
  if (heading == null) return '';
  return `rotate(${(((heading % 360) + 360) % 360)}deg)`;
}

/** Arrow image URL for a device given its signal. Call only when useArrow(heading) is true. */
export function deviceArrowUrl(signal: Signal): string {
  return ARROW_URLS[markerColor(signal)];
}

/** Hex pin colour for a device given its signal. */
export function devicePinColor(signal: Signal): string {
  return PIN_COLORS[markerColor(signal)];
}

/* ── Trail segmentation ─────────────────────────────────────────────────────
   A device's trail is a list of GPS fixes carrying a timestamp `t`. Drawing one
   continuous polyline through every fix bridges gaps where the device went dark
   (no signal, powered off, delayed batch upload) with a straight "teleport" line
   that never happened. splitTrailIntoSegments() breaks the path wherever two
   consecutive fixes are more than `maxGapMinutes` apart in time — or, when a
   timestamp is missing on either side, more than `maxJumpKm` apart in distance —
   so each real leg is rendered as its own polyline and no line spans a gap. */

/** A trail point with a position and an optional ISO timestamp. */
export interface TrailSegmentPoint {
  lat: number;
  lng: number;
  t: string | null;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in kilometres (haversine). */
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Split a chronologically-ordered trail into continuous segments, breaking
 * wherever the connection lapsed. A new segment starts when the time gap between
 * two consecutive points exceeds `maxGapMinutes`. When either point lacks a
 * usable timestamp, it falls back to breaking on a distance jump > `maxJumpKm`.
 * Returns an array of segments (each an array of {lat,lng} usable as a Polyline
 * path). Segments with fewer than 2 points are still returned — the caller is
 * expected to skip those when drawing.
 */
export function splitTrailIntoSegments<T extends TrailSegmentPoint>(
  points: T[],
  maxGapMinutes = 15,
  maxJumpKm = 3,
): Array<Array<{ lat: number; lng: number }>> {
  const segments: Array<Array<{ lat: number; lng: number }>> = [];
  if (!points.length) return segments;

  const maxGapMs = maxGapMinutes * 60_000;
  let current: Array<{ lat: number; lng: number }> = [
    { lat: points[0].lat, lng: points[0].lng },
  ];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur  = points[i];
    const prevT = prev.t ? new Date(prev.t).getTime() : NaN;
    const curT  = cur.t  ? new Date(cur.t).getTime()  : NaN;

    let breakHere: boolean;
    if (!isNaN(prevT) && !isNaN(curT)) {
      // Both timestamped → break on a too-large time gap.
      breakHere = curT - prevT > maxGapMs;
    } else {
      // Missing timestamp on either side → fall back to a distance jump.
      breakHere = haversineKm(prev, cur) > maxJumpKm;
    }

    if (breakHere) {
      segments.push(current);
      current = [];
    }
    current.push({ lat: cur.lat, lng: cur.lng });
  }
  segments.push(current);
  return segments;
}
