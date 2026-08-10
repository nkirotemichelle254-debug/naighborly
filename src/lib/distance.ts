// Lightweight geo helpers for "near me" proximity (bounding-box + haversine).

export interface Coords {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres between two points. */
export function distanceMeters(a: Coords, b: Coords): number | null {
  if (
    typeof a?.latitude !== "number" ||
    typeof a?.longitude !== "number" ||
    typeof b?.latitude !== "number" ||
    typeof b?.longitude !== "number"
  ) {
    return null;
  }
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Human, deliberately approximate distance label.
 * Rounded for privacy — never reveals an exact pin.
 */
export function formatDistance(meters: number): string {
  if (meters < 150) return "Right here";
  if (meters < 1000) return `${Math.round(meters / 100) * 100} m away`;
  if (meters < 10_000) return `${(meters / 1000).toFixed(1)} km away`;
  return `${Math.round(meters / 1000)} km away`;
}

export const DISTANCE_OPTIONS = [
  { label: "1 km", meters: 1000 },
  { label: "3 km", meters: 3000 },
  { label: "5 km", meters: 5000 },
] as const;
