import type { Coordinates } from "./geo";

/** Default map / discovery center (Stockholm) when no user location is known. */
export const DEFAULT_DISCOVERY_CENTER: Coordinates = {
  latitude: 59.3236,
  longitude: 18.0632,
};

export const DISCOVERY_RADIUS_KM = 25;

/** Human-readable label for the default discovery center. */
export const DEFAULT_DISCOVERY_CITY = "Stockholm";
