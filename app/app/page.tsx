import type { Metadata } from "next";
import { loadAppData } from "@/lib/data/app-data";
import { siteDescription, siteName } from "@/lib/seo/metadata";
import { getSiteUrl } from "@/lib/seo/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "../gameon-app";
import { mockEvents } from "../data/mock-data";

export const metadata: Metadata = {
  title: "Find local sports games nearby",
  description: siteDescription,
  alternates: {
    canonical: "/app",
  },
};

function AppJsonLd() {
  const siteUrl = getSiteUrl();
  const appUrl = `${siteUrl}/app`;

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
        "@id": `${appUrl}/#app`,
        name: siteName,
        description: siteDescription,
        url: appUrl,
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

export default async function AppHomePage() {
  if (!hasSupabaseEnv()) {
    return (
      <>
        <AppJsonLd />
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

  const { user, profile, events, pastEvents, ipLocation } = await loadAppData();

  return (
    <>
      <AppJsonLd />
      <h1 className="sr-only">
        {siteName} — Find and join local sports games nearby
      </h1>
      <GameOnApp
        initialEvents={events}
        initialPastEvents={pastEvents}
        initialProfile={profile}
        initialUser={user}
        initialIpLocation={ipLocation}
        usesSupabase={true}
      />
    </>
  );
}
