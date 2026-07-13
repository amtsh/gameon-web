import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

let extraboldFontPromise: Promise<ArrayBuffer> | null = null;

async function loadOgFont(): Promise<ArrayBuffer> {
  if (!extraboldFontPromise) {
    // `fetch(new URL(..., import.meta.url))` only works under the Edge
    // runtime; this route runs on Node.js, where `fetch` has no `file://`
    // support, so read the bundled font from disk instead.
    const fontPath = fileURLToPath(
      new URL("./fonts/inter-latin-ext-800-normal.woff", import.meta.url),
    );
    extraboldFontPromise = readFile(fontPath).then(
      (buffer) => buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
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
