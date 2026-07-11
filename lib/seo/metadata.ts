import type { Metadata } from "next";
import { getSiteUrl } from "./site";

export const siteName = "GameOn";

export const siteDescription =
  "Find and join local sports games nearby. Discover badminton, football, running, and more on the map, then request to join or host your own game.";

export const siteTagline = "Discover and join local games";

const defaultTitle = `${siteName} — Find local sports games nearby`;

export function getSiteMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    applicationName: siteName,
    keywords: [
      "local sports",
      "pickup games",
      "join sports events",
      "host sports games",
      "badminton",
      "football",
      "running",
      "tennis",
      "nearby games",
      "sports map",
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    category: "sports",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "/",
      siteName,
      title: defaultTitle,
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: siteDescription,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
  };
}
