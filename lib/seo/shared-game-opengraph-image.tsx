import { ImageResponse } from "next/og";
import {
  formatSharedGameOgDate,
  formatSharedGameOgTitle,
  formatSharedGameOgVenue,
  sanitizeOgText,
} from "@/lib/seo/format-event-og";
import { ogImageResponseOptions } from "@/lib/seo/og-font";
import {
  DefaultOgImageContent,
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
    return new ImageResponse(
      <OgImageShell>
        <DefaultOgImageContent />
      </OgImageShell>,
      imageOptions,
    );
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
        <OgTitle>{sanitizeOgText(formatSharedGameOgTitle(event))}</OgTitle>
        <OgBody>{dateText}</OgBody>
        <OgBody>{venueLine}</OgBody>
      </OgShowcaseCard>
    </OgImageShell>,
    imageOptions,
  );
}
