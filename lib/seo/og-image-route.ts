import { defaultTitle } from "@/lib/seo/metadata";
import { ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

export function ogImageRouteConfig(alt: string) {
  return {
    alt,
    size: ogImageSize,
    contentType: ogImageContentType,
  } as const;
}

export const defaultOgImageRouteConfig = ogImageRouteConfig(defaultTitle);
export const sharedGameOgImageRouteConfig = ogImageRouteConfig(
  "Shared game on Game On",
);
export const privateGameOgImageRouteConfig = ogImageRouteConfig(
  "Private game invite on Game On",
);
