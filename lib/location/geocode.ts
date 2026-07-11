import type { Coordinates } from "./geo";
import { DEFAULT_DISCOVERY_CENTER } from "./constants";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
};

/** Geocode a postal code or place name via Photon (same provider as venue search). */
export async function geocodePlace(query: string): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: trimmed,
    limit: "1",
    lat: String(DEFAULT_DISCOVERY_CENTER.latitude),
    lon: String(DEFAULT_DISCOVERY_CENTER.longitude),
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!response.ok) return null;

  const data: { features?: PhotonFeature[] } = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  return { latitude, longitude };
}
