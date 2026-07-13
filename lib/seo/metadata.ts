import type { Metadata } from "next";
import { getSiteUrl } from "./site";

export const siteName = "Game On";

export const siteDescription =
  "Browse badminton, cricket, football, running, pickleball, tennis, basketball and more.";

export const siteTagline =
  "Discover local games near you on one map. Request a spot. Show up.";

export const defaultTitle = `${siteName} — ${siteTagline}`;

export const siteKeywords = [
  "local sports",
  "local games",
  "pickup sports",
  "join sports events",
  "host sports games",
  "find games near me",
  "badminton",
  "football",
  "running",
  "tennis",
  "nearby games",
  "sports map",
] as const;

type PageMetadataOptions = {
  title: string;
  description?: string;
  /** Site path, e.g. `/app` or `/privacy`. Resolved against metadataBase for OG URLs. */
  path: string;
  /** Full OG URL override — use when the share URL differs from the canonical path. */
  openGraphUrl?: string;
  openGraphType?: "website" | "article";
  robots?: Metadata["robots"];
  twitterCard?: "summary" | "summary_large_image";
};

/** Build page metadata with consistent canonical, Open Graph, and Twitter fields. */
export function createPageMetadata({
  title,
  description = siteDescription,
  path,
  openGraphUrl,
  openGraphType = "website",
  robots,
  twitterCard = "summary_large_image",
}: PageMetadataOptions): Metadata {
  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: openGraphType,
      url: openGraphUrl ?? path,
      siteName,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
    },
  };

  if (robots) {
    metadata.robots = robots;
  }

  return metadata;
}

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
    keywords: [...siteKeywords],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    category: "sports",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    icons: {
      icon: "/icon",
      apple: "/apple-icon",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
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
