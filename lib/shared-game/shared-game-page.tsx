import { loadAppData } from "@/lib/data/app-data";
import { logSharedLinkLoad } from "@/lib/monitor/log-shared-link-load";
import { siteDescription, siteName } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { sportEventSharePath } from "@/lib/share-token";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "@/app/gameon-app";
import { mockEvents } from "@/app/data/mock-data";
import { findMockEvent } from "./resolve-event";

export { buildSharedGameMetadata, findMockEvent, resolveSharedEvent } from "./resolve-event";

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

  if (sharedEvent) {
    logSharedLinkLoad(sharedEvent.shareToken ?? slug);
  }

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
