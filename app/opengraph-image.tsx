import { ImageResponse } from "next/og";
import { siteDescription, siteName, siteTagline } from "@/lib/seo/metadata";

export const alt = `${siteName} — Find local sports games nearby`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #0b1220 0%, #1f2937 55%, #0f766e 100%)",
          color: "#ffffff",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.12)",
              fontSize: 30,
            }}
          >
            GO
          </div>
          {siteName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            Find local sports games nearby
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: "rgba(255,255,255,0.82)" }}>
            {siteTagline}
          </div>
        </div>

        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>
          {siteDescription}
        </div>
      </div>
    ),
    { ...size },
  );
}
