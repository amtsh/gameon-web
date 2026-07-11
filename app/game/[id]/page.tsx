import type { Metadata } from "next";
import { loadAppData } from "@/lib/data/app-data";
import { fetchSportEvent } from "@/lib/data/events";
import { siteDescription, siteName } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "../../gameon-app";
import { mockEvents } from "../../data/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = hasSupabaseEnv() ? await fetchSportEvent(id) : null;

  return {
    title: event
      ? `${event.title} \u00b7 ${siteName}`
      : `Game not found \u00b7 ${siteName}`,
    description: event
      ? `View details and join ${event.title} on ${siteName}.`
      : siteDescription,
    alternates: { canonical: `/game/${id}` },
  };
}

function GameJsonLd({ id, title }: { id: string; title?: string }) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": `${siteUrl}/game/${id}`,
    url: `${siteUrl}/game/${id}`,
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

export default async function SharedGamePage({ params }: Props) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    const sharedEvent = mockEvents.find((e) => e.id === id) ?? null;
    return (
      <>
        <GameJsonLd id={id} title={sharedEvent?.title} />
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
    await loadAppData(id);

  return (
    <>
      <GameJsonLd id={id} title={sharedEvent?.title} />
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
