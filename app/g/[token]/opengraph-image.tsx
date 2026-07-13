import { createSharedGameOpenGraphImage } from "@/lib/seo/shared-game-opengraph-image";
import { sharedGameOgImageRouteConfig } from "@/lib/seo/og-image-route";

export const { alt, size, contentType } = sharedGameOgImageRouteConfig;
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedGameOpenGraphImage({ params }: Props) {
  const { token } = await params;
  return createSharedGameOpenGraphImage(token);
}
