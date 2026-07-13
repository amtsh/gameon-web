import tzLookup from "@photostructure/tz-lookup";
import type { Venue } from "@/app/types";

const venueTimeZoneCache = new Map<string, string>();

function hasVenueCoordinates(venue: Pick<Venue, "latitude" | "longitude">): boolean {
  return venue.latitude !== 0 || venue.longitude !== 0;
}

function venueCacheKey(venue: Pick<Venue, "latitude" | "longitude">): string {
  return `${venue.latitude},${venue.longitude}`;
}

/** Map a numeric ISO offset to an IANA Etc/GMT zone (POSIX-inverted). */
function timeZoneFromIsoOffset(iso: string): string | null {
  if (iso.endsWith("Z")) return "UTC";

  const match = iso.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, sign, hours, minutes] = match;
  if (minutes !== "00") return null;

  const hourValue = Number(hours);
  if (hourValue === 0) return "UTC";

  const etcSign = sign === "+" ? "-" : "+";
  return `Etc/GMT${etcSign}${hourValue}`;
}

/** Resolve the event wall-clock timezone from venue coordinates or stored offset. */
export function timeZoneForVenue(
  venue: Pick<Venue, "latitude" | "longitude">,
  referenceIso?: string,
): string {
  if (hasVenueCoordinates(venue)) {
    const key = venueCacheKey(venue);
    const cached = venueTimeZoneCache.get(key);
    if (cached) return cached;

    const timeZone = tzLookup(venue.latitude, venue.longitude);
    venueTimeZoneCache.set(key, timeZone);
    return timeZone;
  }

  if (referenceIso) {
    return timeZoneFromIsoOffset(referenceIso) ?? "UTC";
  }

  return "UTC";
}
