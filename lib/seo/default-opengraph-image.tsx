import { ImageResponse } from "next/og";
import { ogImageResponseOptions } from "@/lib/seo/og-font";
import { DefaultOgImageContent, OgImageShell } from "@/lib/seo/og-image";

export async function createDefaultOpenGraphImage() {
  return new ImageResponse(
    <OgImageShell>
      <DefaultOgImageContent />
    </OgImageShell>,
    await ogImageResponseOptions(),
  );
}
