import type { Metadata } from "next";
import { cache } from "react";
import { mockEvents } from "@/app/data/mock-data";
import { loadSportEventForSeo } from "@/lib/data/sport-events";
import { formatSharedGameDescription } from "@/lib/seo/format-event-og";
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

export async function buildSharedGameMetadata(slug: string): Promise<Metadata> {
  const event = await resolveSharedEvent(slug);
  const canonical = event
    ? sportEventSharePath(event.shareToken)
    : sportEventSharePath(slug);

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${canonical}`;

  const title = event ? event.title : defaultTitle;

  const description = event
    ? `${formatSharedGameDescription(event)}. Request a spot on ${siteName}.`
    : siteDescription;

  return createPageMetadata({
    title,
    description,
    path: canonical,
    openGraphUrl: canonicalUrl,
    openGraphImage: false,
    twitterCard: "summary_large_image",
  });
}
