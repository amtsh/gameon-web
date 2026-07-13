import { ogImageContentType, ogImageSize } from "@/lib/seo/og-image";

let regularFont: ArrayBuffer | null = null;
let semiboldFont: ArrayBuffer | null = null;
let boldFont: ArrayBuffer | null = null;
let extraboldFont: ArrayBuffer | null = null;

async function loadOgFonts() {
  if (!regularFont || !semiboldFont || !boldFont || !extraboldFont) {
    const [regular, semibold, bold, extrabold] = await Promise.all([
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-ext-400-normal.woff",
      ).then((response) => response.arrayBuffer()),
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-ext-600-normal.woff",
      ).then((response) => response.arrayBuffer()),
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-ext-700-normal.woff",
      ).then((response) => response.arrayBuffer()),
      fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.5/latin-ext-800-normal.woff",
      ).then((response) => response.arrayBuffer()),
    ]);

    regularFont = regular;
    semiboldFont = semibold;
    boldFont = bold;
    extraboldFont = extrabold;
  }

  return {
    regular: regularFont,
    semibold: semiboldFont,
    bold: boldFont,
    extrabold: extraboldFont,
  };
}

export async function ogImageResponseOptions() {
  const fonts = await loadOgFonts();

  return {
    ...ogImageSize,
    fonts: [
      {
        name: "Inter",
        data: fonts.regular,
        style: "normal" as const,
        weight: 400 as const,
      },
      {
        name: "Inter",
        data: fonts.semibold,
        style: "normal" as const,
        weight: 600 as const,
      },
      {
        name: "Inter",
        data: fonts.bold,
        style: "normal" as const,
        weight: 700 as const,
      },
      {
        name: "Inter",
        data: fonts.extrabold,
        style: "normal" as const,
        weight: 800 as const,
      },
    ],
  };
}

export const ogImageResponseHeaders = {
  "Content-Type": ogImageContentType,
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
};
