import type { Metadata } from "next";
import { loadAppData } from "@/lib/data/app-data";
import { fetchSportEvent } from "@/lib/data/events";
import { siteDescription, siteName } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { sportEventSharePath } from "@/lib/share-token";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "@/app/gameon-app";
import { mockEvents } from "@/app/data/mock-data";

export function findMockEvent(slug: string) {
  return (
    mockEvents.find((event) => event.shareToken === slug || event.id === slug) ??
    null
  );
}

export async function buildSharedGameMetadata(slug: string): Promise<Metadata> {
  const event = hasSupabaseEnv() ? await fetchSportEvent(slug) : findMockEvent(slug);
  const canonical = event
    ? sportEventSharePath(event.shareToken)
    : sportEventSharePath(slug);

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${canonical}`;

  const title = event
    ? `${event.title} \u00b7 ${siteName}`
    : `Game not found \u00b7 ${siteName}`;

  const description = event
    ? `View details and join ${event.title} on ${siteName}.`
    : siteDescription;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      siteName,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function GameJsonLd({
  shareToken,
  title,
}: {
  shareToken: string;
  title?: string;
}) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${sportEventSharePath(shareToken)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": url,
    url,
    name: title ?? siteName,
    description: siteDescription,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export async function SharedGamePage({ slug }: { slug: string }) {
  if (!hasSupabaseEnv()) {
    const sharedEvent = findMockEvent(slug);

    return (
      <>
        <GameJsonLd shareToken={sharedEvent?.shareToken ?? slug} title={sharedEvent?.title} />
        <h1 className="sr-only">{siteName} \u2014 Shared game</h1>
        <GameOnApp
          initialEvents={mockEvents}
          initialPastEvents={[]}
          initialProfile={null}
          initialUser={null}
          initialSharedEvent={sharedEvent}
          usesSupabase={false}
        />
      </>
    );
  }

  const { user, profile, events, pastEvents, sharedEvent, ipLocation } =
    await loadAppData(slug);

  return (
    <>
      <GameJsonLd
        shareToken={sharedEvent?.shareToken ?? slug}
        title={sharedEvent?.title}
      />
      <h1 className="sr-only">{siteName} \u2014 Shared game</h1>
      <GameOnApp
        initialEvents={events}
        initialPastEvents={pastEvents}
        initialProfile={profile}
        initialUser={user}
        initialSharedEvent={sharedEvent ?? null}
        initialIpLocation={ipLocation}
        usesSupabase={true}
      />
    </>
  );
}
