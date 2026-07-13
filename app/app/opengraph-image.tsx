import { createDefaultOpenGraphImage } from "@/lib/seo/default-opengraph-image";
import { defaultOgImageRouteConfig } from "@/lib/seo/og-image-route";

export const { alt, size, contentType } = defaultOgImageRouteConfig;
export default createDefaultOpenGraphImage;
