import type { Metadata } from "next";
import { fetchPastSportEvents } from "@/lib/data/events-past";
import { fetchSportEvents } from "@/lib/data/events";
import { fetchProfile } from "@/lib/data/profile";
import { siteDescription, siteName } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "./gameon-app";
import { mockEvents } from "./data/mock-data";
import type { Profile } from "@/lib/data/profile.shared";

export const metadata: Metadata = {
  title: "Find local sports games nearby",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
};

function HomeJsonLd() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        description: siteDescription,
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#app`,
        name: siteName,
        description: siteDescription,
        url: siteUrl,
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Home() {
  if (!hasSupabaseEnv()) {
    return (
      <>
        <HomeJsonLd />
        <h1 className="sr-only">
          {siteName} — Find and join local sports games nearby
        </h1>
        <GameOnApp
          initialEvents={mockEvents}
          initialPastEvents={[]}
          initialProfile={null}
          initialUser={null}
          usesSupabase={false}
        />
      </>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: Profile | null = null;
  let initialPastEvents: Awaited<ReturnType<typeof fetchPastSportEvents>> = [];

  if (user) {
    [initialProfile, initialPastEvents] = await Promise.all([
      fetchProfile(),
      fetchPastSportEvents(),
    ]);
  }

  const initialEvents = await fetchSportEvents();

  return (
    <>
      <HomeJsonLd />
      <h1 className="sr-only">
        {siteName} — Find and join local sports games nearby
      </h1>
      <GameOnApp
        initialEvents={initialEvents}
        initialPastEvents={initialPastEvents}
        initialProfile={initialProfile}
        initialUser={user}
        usesSupabase={true}
      />
    </>
  );
}
