import type { MetadataRoute } from "next";
import { siteDescription, siteName } from "@/lib/seo/metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: "/home",
    scope: "/",
    id: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0b1220",
    categories: ["sports", "social"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
