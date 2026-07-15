import type { Metadata } from "next";
import { cache } from "react";
import { mockEvents } from "@/app/data/mock-data";
import { loadSportEventForSeo } from "@/lib/data/sport-events";
import { formatSharedGameDescription, formatSharedGameLinkTitle } from "@/lib/seo/format-event-og";
import {
  createPageMetadata,
  defaultTitle,
  siteDescription,
  siteName,
} from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { sportEventSharePath } from "@/lib/share-token";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function findMockEvent(slug: string) {
  return (
    mockEvents.find((event) => event.shareToken === slug || event.id === slug) ??
    null
  );
}

export const resolveSharedEvent = cache(async (slug: string) => {
  if (!hasSupabaseEnv()) return findMockEvent(slug);
  return loadSportEventForSeo(slug);
});

async function buildGameMetadata(
  slug: string,
  options: { isPrivate?: boolean } = {},
): Promise<Metadata> {
  const event = await resolveSharedEvent(slug);
  const path = sportEventSharePath(event?.shareToken ?? slug, options);

  const siteUrl = getSiteUrl();
  const openGraphUrl = `${siteUrl}${path}`;

  const title = event ? formatSharedGameLinkTitle(event) : defaultTitle;

  const description = event
    ? `${formatSharedGameDescription(event)}. Request a spot on ${siteName}.`
    : siteDescription;

  return createPageMetadata({
    title,
    description,
    path,
    openGraphUrl,
    openGraphImage: false,
    twitterCard: "summary_large_image",
  });
}

export function buildSharedGameMetadata(slug: string): Promise<Metadata> {
  return buildGameMetadata(slug);
}

/** Metadata for the /g/private/{token} invite alias (same event, private URL). */
export function buildPrivateSharedGameMetadata(slug: string): Promise<Metadata> {
  return buildGameMetadata(slug, { isPrivate: true });
}
