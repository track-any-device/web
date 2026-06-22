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
