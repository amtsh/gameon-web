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

export type GeocodeOptions = {
  signal?: AbortSignal;
  /** Where to bias results, e.g. the user's IP-derived location. Defaults to Stockholm. */
  bias?: Coordinates;
  /** ISO country code (lowercase, e.g. "se") to prefer among candidate matches. */
  countryCode?: string;
};

/** Geocode a postal code or place name via Photon, returning coordinates and area label together. */
export async function geocodePlaceDetailed(
  query: string,
  options?: GeocodeOptions,
): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const bias = options?.bias ?? DEFAULT_DISCOVERY_CENTER;
  const params = new URLSearchParams({
    q: trimmed,
    // Fetch multiple candidates when we can filter by country; otherwise just the top match.
    limit: options?.countryCode ? "5" : "1",
    lat: String(bias.latitude),
    lon: String(bias.longitude),
  });

  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal: options?.signal,
  });
  if (!response.ok) return null;

  const data: { features?: PhotonFeature[] } = await response.json();
  const features = data.features ?? [];
  if (!features.length) return null;

  const feature =
    (options?.countryCode &&
      features.find(
        (candidate) =>
          candidate.properties?.countrycode?.toLowerCase() ===
          options.countryCode,
      )) ||
    features[0];

  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    coordinates: { latitude, longitude },
    label: formatReverseGeocodeLabel(feature.properties ?? {}),
  };
}

/** Geocode a postal code or place name via Photon (same provider as venue search). */
export async function geocodePlace(
  query: string,
  options?: GeocodeOptions,
): Promise<Coordinates | null> {
  const result = await geocodePlaceDetailed(query, options);
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
