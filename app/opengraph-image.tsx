import { ImageResponse } from "next/og";
import { defaultTitle } from "@/lib/seo/metadata";
import { ogImageResponseOptions } from "@/lib/seo/og-font";
import {
  DefaultOgImageContent,
  OgImageShell,
  ogImageContentType,
  ogImageSize,
} from "@/lib/seo/og-image";

export const alt = defaultTitle;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function OpenGraphImage() {
  return new ImageResponse(
    <OgImageShell>
      <DefaultOgImageContent />
    </OgImageShell>,
    await ogImageResponseOptions(),
  );
}
