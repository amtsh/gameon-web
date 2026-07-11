import type { Profile } from "@/lib/data/profile.shared";
import {
  DEFAULT_DISCOVERY_CENTER,
  DISCOVERY_RADIUS_KM,
} from "./constants";
import { haversineDistanceKm, type Coordinates } from "./geo";

export type DiscoveryFilter = {
  center: Coordinates;
  radiusKm: number;
};

export const DEFAULT_DISCOVERY_FILTER: DiscoveryFilter = {
  center: DEFAULT_DISCOVERY_CENTER,
  radiusKm: DISCOVERY_RADIUS_KM,
};

export function resolveDiscoveryCenterFromProfile(
  profile: Profile | null | undefined,
): Coordinates | null {
  if (
    profile?.postal_latitude != null &&
    profile?.postal_longitude != null &&
    Number.isFinite(profile.postal_latitude) &&
    Number.isFinite(profile.postal_longitude)
  ) {
    return {
      latitude: profile.postal_latitude,
      longitude: profile.postal_longitude,
    };
  }
  return null;
}

export function isSameDiscoveryFilter(a: DiscoveryFilter, b: DiscoveryFilter): boolean {
  return (
    a.center.latitude === b.center.latitude &&
    a.center.longitude === b.center.longitude &&
    a.radiusKm === b.radiusKm
  );
}

/** GPS → profile postal code → IP → Stockholm default. */
export function resolveDiscoveryFilter(
  profile: Profile | null | undefined,
  gpsCenter?: Coordinates | null,
  ipCenter?: Coordinates | null,
): DiscoveryFilter {
  const fromGps = validCoordinates(gpsCenter);
  const fromIp = validCoordinates(ipCenter);

  return {
    center:
      fromGps ??
      resolveDiscoveryCenterFromProfile(profile) ??
      fromIp ??
      DEFAULT_DISCOVERY_CENTER,
    radiusKm: DISCOVERY_RADIUS_KM,
  };
}

function validCoordinates(center: Coordinates | null | undefined): Coordinates | null {
  if (
    center != null &&
    Number.isFinite(center.latitude) &&
    Number.isFinite(center.longitude)
  ) {
    return center;
  }
  return null;
}

type UserEventContext = {
  hostedEventIds: Set<string>;
  participantEventIds: Set<string>;
  pendingRequestEventIds: Set<string>;
  waitlistEventIds: Set<string>;
};

export function isUserRelatedEvent(
  eventId: string,
  ctx: UserEventContext,
): boolean {
  return (
    ctx.hostedEventIds.has(eventId) ||
    ctx.participantEventIds.has(eventId) ||
    ctx.pendingRequestEventIds.has(eventId) ||
    ctx.waitlistEventIds.has(eventId)
  );
}

export function isWithinDiscoveryRadius(
  venue: Coordinates,
  filter: DiscoveryFilter,
): boolean {
  return haversineDistanceKm(filter.center, venue) <= filter.radiusKm;
}
