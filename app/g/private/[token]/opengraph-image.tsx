import { createSharedGameOpenGraphImage } from "@/lib/seo/shared-game-opengraph-image";
import { ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

export const alt = "Private game invite on Game On";
export const dynamic = "force-dynamic";
export const size = ogImageSize;
export const contentType = ogImageContentType;

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PrivateSharedGameOpenGraphImage({
  params,
}: Props) {
  const { token } = await params;
  return createSharedGameOpenGraphImage(token);
}
