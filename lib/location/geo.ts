export type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometres. */
export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.max(Math.round(km * 1000), 100)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const KM_PER_DEGREE_LAT = 110.574;
const KM_PER_DEGREE_LNG_AT_EQUATOR = 111.32;

/**
 * Rectangular (not exact-circle) bounding box for a center + radius, for use
 * as a cheap DB pre-filter — callers still need a precise haversine check on
 * the result. Doesn't handle antimeridian wraparound; acceptable for the
 * small discovery radii this app uses.
 */
export function boundingBoxForRadius(
  center: Coordinates,
  radiusKm: number,
): BoundingBox {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const kmPerDegreeLng =
    KM_PER_DEGREE_LNG_AT_EQUATOR * Math.cos((center.latitude * Math.PI) / 180);
  const lngDelta = kmPerDegreeLng > 1 ? radiusKm / kmPerDegreeLng : 180;

  return {
    minLat: Math.max(center.latitude - latDelta, -90),
    maxLat: Math.min(center.latitude + latDelta, 90),
    minLng: Math.max(center.longitude - lngDelta, -180),
    maxLng: Math.min(center.longitude + lngDelta, 180),
  };
}
