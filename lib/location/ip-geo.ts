import type { Coordinates } from "./geo";

/** Parse IP geolocation coordinates from Vercel edge headers. */
export function parseIpCoordinates(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): Coordinates | null {
  if (latitude == null || longitude == null) return null;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { latitude: lat, longitude: lon };
}

export function readIpCoordinatesFromHeaderMap(
  headers: Headers,
): Coordinates | null {
  return parseIpCoordinates(
    headers.get("x-vercel-ip-latitude"),
    headers.get("x-vercel-ip-longitude"),
  );
}

/** ISO country code (lowercase) from Vercel edge headers, e.g. "se". */
export function readIpCountryCodeFromHeaderMap(
  headers: Headers,
): string | null {
  const country = headers.get("x-vercel-ip-country");
  return country ? country.toLowerCase() : null;
}
