import type { Coordinates } from "./geo";
import { DEFAULT_DISCOVERY_CENTER } from "./constants";

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties?: Record<string, string | undefined>;
};

export type GeocodeResult = {
  coordinates: Coordinates;
  /** Area/city label derived from the same lookup, e.g. for an "area detected" hint. */
  label: string | null;
};

/** Geocode a postal code or place name via Photon, returning coordinates and area label together. */
export async function geocodePlaceDetailed(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    q: trimmed,
    limit: "1",
    lat: String(DEFAULT_DISCOVERY_CENTER.latitude),
    lon: String(DEFAULT_DISCOVERY_CENTER.longitude),
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal: options?.signal,
  });
  if (!response.ok) return null;

  const data: { features?: PhotonFeature[] } = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    coordinates: { latitude, longitude },
    label: formatReverseGeocodeLabel(feature.properties ?? {}),
  };
}

/** Geocode a postal code or place name via Photon (same provider as venue search). */
export async function geocodePlace(query: string): Promise<Coordinates | null> {
  const result = await geocodePlaceDetailed(query);
  return result?.coordinates ?? null;
}

/** Build a human-readable discovery label from Photon reverse-geocode properties. */
export function formatReverseGeocodeCity(
  props: Record<string, string | undefined>,
): string | null {
  const city = props.city?.trim();
  if (city) return city;

  const locality = props.locality?.trim();
  if (locality) return locality;

  const name = props.name?.trim();
  if (name) return name;

  return null;
}

/** Area + city when both are available (e.g. Södermalm, Stockholm). */
export function formatReverseGeocodeLabel(
  props: Record<string, string | undefined>,
): string | null {
  const city = props.city?.trim();
  const district = props.district?.trim();
  const suburb = props.suburb?.trim();
  const locality = props.locality?.trim();
  const name = props.name?.trim();

  const area =
    district ??
    suburb ??
    (locality && locality !== city ? locality : null);

  if (area && city && area !== city) {
    return `${area}, ${city}`;
  }
  if (city) return city;
  if (locality) return locality;
  if (name) return name;
  return null;
}

/** Resolve a city or locality name from coordinates via Photon reverse geocoding. */
export async function reverseGeocodeCity(
  coords: Coordinates,
  options?: { cityOnly?: boolean },
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(coords.latitude),
    lon: String(coords.longitude),
  });

  const response = await fetch(`https://photon.komoot.io/reverse?${params}`);
  if (!response.ok) return null;

  const data: { features?: PhotonFeature[] } = await response.json();
  const props = data.features?.[0]?.properties;
  if (!props) return null;

  return options?.cityOnly
    ? formatReverseGeocodeCity(props)
    : formatReverseGeocodeLabel(props);
}
