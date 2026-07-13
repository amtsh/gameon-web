import type { CSSProperties, ReactNode } from "react";
import { homeAppTitle, siteDescription, siteName } from "@/lib/seo/metadata";

/** Landscape canvas for social link previews. */
export const ogImageSize = { width: 1200, height: 750 };
export const ogImageContentType = "image/png";

export const landingColors = {
  ink: "#000000",
  body: "#6e6e73",
  bodyDark: "#48484d",
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

/** Text tokens for full-canvas OG layout — sized to fit 1200×750 without overflow. */
export const ogTypography = {
  brand: {
    fontSize: 60,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: landingColors.ink,
  },
  title: {
    fontSize: 84,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: landingColors.ink,
    textAlign: "center" as const,
    maxWidth: 1000,
  },
  titleCompact: {
    fontSize: 72,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    color: landingColors.ink,
    textAlign: "center" as const,
    maxWidth: 1000,
  },
  body: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1.35,
    color: landingColors.bodyDark,
    textAlign: "center" as const,
    maxWidth: 980,
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

/** Brand mark above OG content. */
export function OgBrandHeader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        ...ogTextStyle("brand"),
      }}
    >
      <MapPinSearchIcon size={60} strokeWidth={2.25} />
      {siteName}
    </div>
  );
}

/** White showcase card — mirrors landing `.lp-showcase-card` at OG scale. */
export function OgShowcaseCard({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        maxWidth: 1040,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 64px",
        borderRadius: 48,
        border: "1px solid #ececec",
        background: "#ffffff",
        textAlign: "center",
      }}
    >
      <OgContentStack>{children}</OgContentStack>
    </div>
  );
}

/** Centered content stack inside the showcase card. */
export function OgContentStack({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export function OgTitle({
  children,
  compact = false,
  style,
}: {
  children: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={ogTextStyle(compact ? "titleCompact" : "title", style)}>
      {children}
    </div>
  );
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
      <OgTitle>{homeAppTitle}</OgTitle>
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
          padding: "64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
