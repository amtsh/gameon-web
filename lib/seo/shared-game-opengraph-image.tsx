import { ImageResponse } from "next/og";
import {
  formatSharedGameOgDate,
  formatSharedGameOgTitle,
  formatSharedGameOgVenue,
  sanitizeOgText,
} from "@/lib/seo/format-event-og";
import { createDefaultOpenGraphImage } from "@/lib/seo/default-opengraph-image";
import { ogImageResponseOptions } from "@/lib/seo/og-font";
import {
  OgBody,
  OgBrandHeader,
  OgImageShell,
  OgShowcaseCard,
  OgTitle,
} from "@/lib/seo/og-image";
import { resolveSharedEvent } from "@/lib/shared-game/resolve-event";

export async function createSharedGameOpenGraphImage(token: string) {
  let event = null;

  try {
    event = await resolveSharedEvent(token);
  } catch {
    event = null;
  }

  const imageOptions = await ogImageResponseOptions();

  if (!event) {
    return createDefaultOpenGraphImage();
  }
  const venue = formatSharedGameOgVenue(event);
  const dateText = sanitizeOgText(formatSharedGameOgDate(event));
  const venueLine = sanitizeOgText(
    venue.subtitle ? `${venue.name} · ${venue.subtitle}` : venue.name,
  );

  return new ImageResponse(
    <OgImageShell>
      <OgShowcaseCard>
        <OgBrandHeader />
        <OgTitle compact>
          {sanitizeOgText(formatSharedGameOgTitle(event))}
        </OgTitle>
        <OgBody>{dateText}</OgBody>
        <OgBody>{venueLine}</OgBody>
      </OgShowcaseCard>
    </OgImageShell>,
    imageOptions,
  );
}
