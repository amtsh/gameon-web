import type { Profile } from "@/lib/data/profile.shared";
import {
  DEFAULT_DISCOVERY_CENTER,
  DISCOVERY_CENTER_STORAGE_KEY,
  DISCOVERY_RADIUS_KM,
} from "./constants";
import {
  resolveDiscoveryCenterFromProfile,
  type DiscoveryFilter,
} from "./discovery";
import { type Coordinates } from "./geo";

export function readStoredDiscoveryCenter(): Coordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISCOVERY_CENTER_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "latitude" in parsed &&
      "longitude" in parsed &&
      typeof (parsed as Coordinates).latitude === "number" &&
      typeof (parsed as Coordinates).longitude === "number"
    ) {
      return parsed as Coordinates;
    }
  } catch {
    // Ignore corrupt storage.
  }
  return null;
}

export function storeDiscoveryCenter(center: Coordinates) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DISCOVERY_CENTER_STORAGE_KEY,
    JSON.stringify(center),
  );
}

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

/** Best available discovery center on the client (profile → localStorage → GPS → default). */
export async function resolveClientDiscoveryFilter(
  profile: Profile | null | undefined,
): Promise<DiscoveryFilter> {
  const fromProfile = resolveDiscoveryCenterFromProfile(profile);
  if (fromProfile) {
    return { center: fromProfile, radiusKm: DISCOVERY_RADIUS_KM };
  }

  const stored = readStoredDiscoveryCenter();
  if (stored) {
    return { center: stored, radiusKm: DISCOVERY_RADIUS_KM };
  }

  try {
    const device = await getDeviceCoordinates();
    storeDiscoveryCenter(device);
    return { center: device, radiusKm: DISCOVERY_RADIUS_KM };
  } catch {
    return { center: DEFAULT_DISCOVERY_CENTER, radiusKm: DISCOVERY_RADIUS_KM };
  }
}
