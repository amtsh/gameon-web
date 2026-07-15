import { headers } from "next/headers";
import type { Coordinates } from "./geo";
import { parseIpCoordinates } from "./ip-geo";

type MinimalCfProperties = {
  latitude?: string;
  longitude?: string;
  country?: string;
};

export type IpGeo = {
  coordinates: Coordinates | null;
  /** ISO country code (lowercase, e.g. "se"). */
  countryCode: string | null;
};

const emptyGeo: IpGeo = { coordinates: null, countryCode: null };

async function readVercelGeo(): Promise<IpGeo> {
  const requestHeaders = await headers();
  const latitude = requestHeaders.get("x-vercel-ip-latitude");
  const longitude = requestHeaders.get("x-vercel-ip-longitude");
  const country = requestHeaders.get("x-vercel-ip-country");

  return {
    coordinates: parseIpCoordinates(latitude, longitude),
    countryCode: country ? country.toLowerCase() : null,
  };
}

async function readCloudflareGeoFromContext(): Promise<IpGeo> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { cf } = await getCloudflareContext<MinimalCfProperties>({
      async: true,
    });
    return {
      coordinates: parseIpCoordinates(cf?.latitude, cf?.longitude),
      countryCode: cf?.country ? cf.country.toLowerCase() : null,
    };
  } catch {
    return emptyGeo;
  }
}

/** Visitor location/country from edge headers (Vercel) or Cloudflare request.cf (OpenNext). */
export async function readCloudflareGeo(): Promise<IpGeo> {
  if (process.env.VERCEL) {
    return readVercelGeo();
  }

  return readCloudflareGeoFromContext();
}
