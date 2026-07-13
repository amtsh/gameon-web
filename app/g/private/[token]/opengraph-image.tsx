import { createSharedGameOpenGraphImage } from "@/lib/seo/shared-game-opengraph-image";
import {
  ogImageDynamic,
  privateGameOgImageRouteConfig,
} from "@/lib/seo/og-image-route";

export const { alt, size, contentType } = privateGameOgImageRouteConfig;
export const dynamic = ogImageDynamic;

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PrivateSharedGameOpenGraphImage({
  params,
}: Props) {
  const { token } = await params;
  return createSharedGameOpenGraphImage(token);
}
