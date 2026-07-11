const DEFAULT_SITE_URL = "https://gameon-web-psi.vercel.app";

/** Canonical public site URL for metadata, sitemap, and structured data. */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost.replace(/\/$/, "")}`;
  }

  return DEFAULT_SITE_URL;
}
