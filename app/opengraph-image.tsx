import { ImageResponse } from "next/og";
import {
  defaultTitle,
  siteDescription,
  siteName,
  siteTagline,
} from "@/lib/seo/metadata";

export const alt = defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const landingColors = {
  ink: "#000000",
  body: "#6e6e73",
  mute: "#8a8a8a",
  background: "linear-gradient(135deg, #fff7f1 0%, #ffebeb 45%, #fff9f4 100%)",
  orbPeach:
    "radial-gradient(ellipse at center, rgba(255, 162, 119, 0.61) 0%, rgba(255, 162, 119, 0) 70%)",
  orbRose:
    "radial-gradient(ellipse at center, rgba(255, 128, 153, 0.53) 0%, rgba(255, 128, 153, 0) 70%)",
  orbAmber:
    "radial-gradient(ellipse at center, rgba(255, 187, 140, 0.47) 0%, rgba(255, 187, 140, 0) 70%)",
} as const;

function MapPinSearchIcon({
  size,
  strokeWidth,
}: {
  size: number;
  strokeWidth: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 12.248 21.969 a 1 1 0 0 1 -0.849 -0.17 C 9.539 20.193 4 14.993 4 10 a 8 8 0 0 1 16 0 C 20 10.42 19.961 10.841 19.888 11.262" />
      <path d="m22 22-1.88-1.88" />
      <circle cx="12" cy="10" r="3" />
      <circle cx="18" cy="18" r="3" />
    </svg>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: landingColors.background,
        color: landingColors.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: landingColors.orbPeach,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 80,
          right: -60,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: landingColors.orbRose,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: "28%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: landingColors.orbAmber,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
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
          <MapPinSearchIcon size={34} strokeWidth={2.25} />
          {siteName}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            Join or host local games near you
          </div>
        </div>

        <div style={{ fontSize: 24, color: landingColors.mute }}>
          {siteDescription}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
