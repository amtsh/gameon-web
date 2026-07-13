import { ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

let extraboldFontPromise: Promise<ArrayBuffer> | null = null;

async function loadOgFont(): Promise<ArrayBuffer> {
  if (!extraboldFontPromise) {
    const fontUrl = new URL(
      "./fonts/inter-latin-ext-800-normal.woff",
      import.meta.url,
    );
    extraboldFontPromise = fetch(fontUrl).then((response) =>
      response.arrayBuffer(),
    );
  }

  return extraboldFontPromise;
}

export const ogImageResponseHeaders = {
  "Content-Type": ogImageContentType,
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
} as const;

export async function ogImageResponseOptions() {
  const font = await loadOgFont();

  return {
    ...ogImageSize,
    fonts: [
      {
        name: "Inter",
        data: font,
        style: "normal" as const,
        weight: 800 as const,
      },
    ],
    headers: ogImageResponseHeaders,
  };
}
