import type { CSSProperties, ReactNode } from "react";
import { siteDescription, siteName } from "@/lib/seo/metadata";

/** Portrait canvas — taller than wide, for social/story-style previews. */
export const ogImageSize = { width: 1200, height: 750 };
export const ogImageContentType = "image/png";

export const landingColors = {
  ink: "#000000",
  body: "#6e6e73",
  mute: "#8a8a8a",
  fontFamily: "Inter",
  background: "linear-gradient(135deg, #fff7f1 0%, #ffebeb 45%, #fff9f4 100%)",
  orbPeach:
    "radial-gradient(ellipse at center, rgba(255, 162, 119, 0.61) 0%, rgba(255, 162, 119, 0) 70%)",
  orbRose:
    "radial-gradient(ellipse at center, rgba(255, 128, 153, 0.53) 0%, rgba(255, 128, 153, 0) 70%)",
  orbAmber:
    "radial-gradient(ellipse at center, rgba(255, 187, 140, 0.47) 0%, rgba(255, 187, 140, 0) 70%)",
} as const;

/** Text tokens mirroring `.lp-showcase-card` h3/p, scaled up for the portrait OG canvas. */
export const ogTypography = {
  brand: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: landingColors.ink,
  },
  title: {
    fontSize: 80,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.12,
    color: landingColors.ink,
    textAlign: "center" as const,
  },
  body: {
    fontSize: 36,
    fontWeight: 800,
    lineHeight: 1.45,
    color: landingColors.body,
    textAlign: "center" as const,
  },
} as const;

type OgTextVariant = keyof typeof ogTypography;

function ogTextStyle(
  variant: OgTextVariant,
  extra?: CSSProperties,
): CSSProperties {
  return {
    fontFamily: landingColors.fontFamily,
    margin: 0,
    ...ogTypography[variant],
    ...extra,
  };
}

export function MapPinSearchIcon({
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

/** Sits above the card content, matching the top nav brand mark. */
export function OgBrandHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: 8,
        ...ogTextStyle("brand"),
      }}
    >
      <MapPinSearchIcon size={40} strokeWidth={2.25} />
      {siteName}
    </div>
  );
}

/** Mirrors `.lp-showcase-card`: white rounded card, centered content. */
export function OgShowcaseCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        maxWidth: 980,
        padding: "80px 72px",
        borderRadius: 48,
        background: "#ffffff",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export function OgTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={ogTextStyle("title", style)}>{children}</div>;
}

export function OgBody({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return <div style={ogTextStyle("body", style)}>{children}</div>;
}

export function DefaultOgImageContent() {
  return (
    <OgShowcaseCard>
      <OgBrandHeader />
      <OgTitle>Join or host local games near you</OgTitle>
      <OgBody>{siteDescription}</OgBody>
    </OgShowcaseCard>
  );
}

export function OgImageShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: landingColors.background,
        color: landingColors.ink,
        fontFamily: landingColors.fontFamily,
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
          alignItems: "center",
          justifyContent: "center",
          padding: "56px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
