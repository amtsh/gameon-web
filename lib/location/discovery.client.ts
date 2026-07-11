import { type Coordinates } from "./geo";
import type { Profile } from "@/lib/data/profile.shared";
import { DEFAULT_DISCOVERY_CITY } from "./constants";
import {
  discoveryLocationLabelSync,
  resolveDiscoveryCenterSource,
  resolveDiscoveryFilter,
} from "./discovery";
import { reverseGeocodeCity } from "./geocode";

export function getDeviceCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => reject(new Error("Could not get location")),
      { timeout: 8_000, maximumAge: 60_000 },
    );
  });
}

/** Postal code, reverse-geocoded city, or default city for the active discovery center. */
export async function resolveDiscoveryLocationLabel(
  profile: Profile | null | undefined,
  gpsCenter?: Coordinates | null,
  ipCenter?: Coordinates | null,
): Promise<string> {
  const source = resolveDiscoveryCenterSource(profile, gpsCenter, ipCenter);
  const sync = discoveryLocationLabelSync(source, profile);
  if (sync) return sync;

  const filter = resolveDiscoveryFilter(profile, gpsCenter, ipCenter);
  const city = await reverseGeocodeCity(filter.center);
  return city ?? DEFAULT_DISCOVERY_CITY;
}

export { initialDiscoveryFilter, initialDiscoveryLocationLabel } from "./discovery";
