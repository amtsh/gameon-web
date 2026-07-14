import { getCloudflareContext } from "@opennextjs/cloudflare";
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

/** Visitor location/country from Cloudflare's request.cf properties (this app runs on Cloudflare Workers via OpenNext). */
export async function readCloudflareGeo(): Promise<IpGeo> {
  const { cf } = await getCloudflareContext<MinimalCfProperties>({
    async: true,
  });
  return {
    coordinates: parseIpCoordinates(cf?.latitude, cf?.longitude),
    countryCode: cf?.country ? cf.country.toLowerCase() : null,
  };
}
