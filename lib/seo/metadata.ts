import type { Metadata } from "next";
import { getSiteUrl } from "./site";

export const siteName = "Game On";

export const siteDescription =
  "Browse badminton, cricket, football, running, pickleball, tennis, basketball and more.";

export const siteTagline =
  "Discover local games near you on one map. Request a spot. Show up.";

export const defaultTitle = `${siteName} — ${siteTagline}`;

/** Shared landing OG image — used for every route except /g/[token]. */
export const defaultOgImagePath = "/opengraph-image";

export const defaultOgImage = {
  url: defaultOgImagePath,
  width: 1200,
  height: 630,
  alt: defaultTitle,
} as const;

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
  /** Pass false when a route segment defines its own opengraph-image file. */
  openGraphImage?: string | false;
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
  openGraphImage = defaultOgImagePath,
  openGraphType = "website",
  robots,
  twitterCard = "summary_large_image",
}: PageMetadataOptions): Metadata {
  const openGraphImages =
    openGraphImage === false
      ? undefined
      : [{ ...defaultOgImage, url: openGraphImage }];

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
      ...(openGraphImages ? { images: openGraphImages } : {}),
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      ...(openGraphImages ? { images: [openGraphImages[0].url] } : {}),
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
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: siteDescription,
      images: [defaultOgImagePath],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: siteName,
    },
  };
}
