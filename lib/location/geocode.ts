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
  /** ISO country code (lowercase, e.g. "se") to scope the lookup to. */
  countryCode?: string;
};

type ZippopotamPlace = {
  "place name": string;
  state?: string;
  latitude: string;
  longitude: string;
};

type ZippopotamResponse = {
  places?: ZippopotamPlace[];
};

/** Exact, country-scoped postal-code lookup — no cross-country ambiguity. */
async function geocodeViaZippopotam(
  postalCode: string,
  countryCode: string,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const response = await fetch(
    `https://api.zippopotam.us/${countryCode}/${encodeURIComponent(postalCode)}`,
    { signal },
  );
  if (!response.ok) return null;

  const data: ZippopotamResponse = await response.json();
  const place = data.places?.[0];
  if (!place) return null;

  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const placeName = place["place name"];
  const label =
    place.state && place.state !== placeName
      ? `${placeName}, ${place.state}`
      : placeName;

  return { coordinates: { latitude, longitude }, label: label ?? null };
}

/** Free-text fallback via Photon. When a country is known, only accepts a same-country
    candidate — silently returning a match from the wrong country is worse than "not found". */
async function geocodeViaPhoton(
  query: string,
  options?: GeocodeOptions,
): Promise<GeocodeResult | null> {
  const bias = options?.bias ?? DEFAULT_DISCOVERY_CENTER;
  const params = new URLSearchParams({
    q: query,
    limit: options?.countryCode ? "10" : "1",
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

  const feature = options?.countryCode
    ? features.find(
        (candidate) =>
          candidate.properties?.countrycode?.toLowerCase() ===
          options.countryCode,
      )
    : features[0];
  if (!feature) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  return {
    coordinates: { latitude, longitude },
    label: formatReverseGeocodeLabel(feature.properties ?? {}),
  };
}

/** Geocode a postal code or place name, returning coordinates and area label together.
    Tries an exact country-scoped postal-code lookup first, falling back to free-text search. */
export async function geocodePlaceDetailed(
  query: string,
  options?: GeocodeOptions,
): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  if (options?.countryCode) {
    try {
      const exact = await geocodeViaZippopotam(
        trimmed,
        options.countryCode,
        options.signal,
      );
      if (exact) return exact;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      // Zippopotam unreachable or doesn't cover this country — fall through to Photon.
    }
  }

  return geocodeViaPhoton(trimmed, options);
}

/** Geocode a postal code or place name (same provider as venue search, plus Zippopotam). */
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
