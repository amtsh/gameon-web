import type { Coordinates } from "./geo";
import { parseIpCoordinates } from "./ip-geo";

export type IpLocation = {
  coordinates: Coordinates | null;
  /** ISO country code (lowercase, e.g. "se"), for scoping geocode lookups. */
  countryCode: string | null;
};

/** Session-only IP fix + country via our edge route, for biasing/scoping geocode lookups. */
export async function fetchIpLocation(): Promise<IpLocation> {
  const response = await fetch("/api/geo");
  if (response.status === 204 || !response.ok) {
    return { coordinates: null, countryCode: null };
  }
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    return { coordinates: null, countryCode: null };
  }

  const record = data as Record<string, unknown>;
  const coordinates =
    "latitude" in record && "longitude" in record
      ? parseIpCoordinates(String(record.latitude), String(record.longitude))
      : null;
  const countryCode =
    typeof record.countryCode === "string" ? record.countryCode : null;

  return { coordinates, countryCode };
}
