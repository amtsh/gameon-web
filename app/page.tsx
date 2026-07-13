import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  MapPin,
  MapPinSearch,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { resolveInitialDiscoveryLocationLabel } from "@/lib/location/discovery";
import { readIpCoordinatesFromHeaderMap } from "@/lib/location/ip-geo";
import { siteName } from "@/lib/seo/metadata";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { loadAppData } from "@/lib/data/app-data";
import { LandingCity, LandingLocationProvider } from "./landing/LandingCity";
import { CompareMark } from "./landing/CompareMark";
import { LandingSportPills } from "./landing/LandingSportPills";
import { LandingTipGrid } from "./landing/LandingTipGrid";
import { HeroBackground } from "./landing/HeroBackground";
import "./landing.css";

export const metadata: Metadata = {
  title: "Join or host local games near you",
  description:
    "Game On maps local sports games near you. Find open games, request a spot, and play — no group chat needed.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Join or host local games near you",
    description:
      "Game On maps local sports games near you. Find open games, request a spot, and play — no group chat needed.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join or host local games near you",
    description:
      "Game On maps local sports games near you. Find open games, request a spot, and play — no group chat needed.",
  },
};

const howItWorksTips = [
  {
    title: "Find open games on the map",
    body: "Browse pins near you and see who is playing before you commit.",
    icon: MapPin,
    iconVariant: "rose" as const,
  },
  {
    title: "Request a spot in two taps",
    body: "Send a join request from the map. No group chat thread required.",
    icon: UserPlus,
    iconVariant: "sky" as const,
  },
  {
    title: "Get approved or join automatically",
    body: "Hosts can approve requests manually, or auto-join can put you in instantly.",
    icon: CheckCircle2,
    iconVariant: "violet" as const,
  },
  {
    title: "Add games to your calendar",
    body: "Save confirmed games for reminders so you do not miss kickoff.",
    icon: Calendar,
    iconVariant: "rose" as const,
  },
  {
    title: "Host once and fill your roster",
    body: "Set capacity once, then let requests and waitlists handle the rest.",
    icon: Users,
    iconVariant: "sky" as const,
  },
  {
    title: "Keep your contact private",
    body: "Your details reach a host only after they approve you — never posted publicly.",
    icon: Shield,
    iconVariant: "violet" as const,
  },
];

const compareRows = [
  { label: "Find a game tonight", chat: false, gameon: true },
  { label: "See who's actually coming", chat: false, gameon: true },
  { label: "Auto-fill a dropped spot", chat: false, gameon: true },
  { label: "Calendar reminders", chat: false, gameon: true },
  { label: "Browse without joining a group", chat: false, gameon: true },
  { label: "Requires everyone to reply", chat: true, gameon: false },
];

export default async function LandingPage() {
  if (hasSupabaseEnv()) {
    const { user } = await loadAppData();
    if (user) {
      redirect("/app");
    }
  }

  const ipLocation = readIpCoordinatesFromHeaderMap(await headers());
  const initialCityLabel = await resolveInitialDiscoveryLocationLabel(
    null,
    ipLocation,
    { cityOnly: true },
  );

  return (
    <LandingLocationProvider
      initialIpLocation={ipLocation}
      initialLabel={initialCityLabel}
    >
      <div className="lp">
        <div className="lp-hero-fold">
          <HeroBackground />
          <header className="lp-top">
            <div className="lp-top-inner">
              <Link className="lp-logo" href="/">
                <MapPinSearch
                  aria-hidden
                  className="lp-logo-icon"
                  size={20}
                  strokeWidth={2.25}
                />
                {siteName}
              </Link>
              <div className="lp-top-actions">
                <LandingCity className="lp-city" />
                <Link className="lp-btn lp-btn-dark lp-btn-sm" href="/app">
                  Open map
                </Link>
              </div>
            </div>
          </header>

          <section className="lp-hero">
            <div className="lp-container lp-hero-grid">
              <div className="lp-hero-copy">
                <h1>Join or host local games near you</h1>
                <p className="lp-hero-sub">
                  Local sports on one map. Request a spot. Show up.
                </p>

                <form className="lp-request" action="/app" method="get">
                  <div className="lp-field">
                    <span className="lp-field-label">Near</span>
                    <LandingCity className="lp-field-value" iconSize={16} />
                  </div>
                  <div className="lp-field">
                    <span className="lp-field-label">Looking for</span>
                    <span className="lp-field-value">
                      Any sport · Open games
                    </span>
                  </div>
                  <button
                    className="lp-btn lp-btn-dark lp-request-submit"
                    type="submit"
                  >
                    See games
                    <ArrowRight size={16} aria-hidden />
                  </button>
                </form>

                <p className="lp-hero-note">
                  Free to browse · No install required
                </p>
              </div>

              <div className="lp-hero-visual">
                <Image
                  alt="Game On map showing nearby pickup games"
                  className="lp-hero-image"
                  height={1398}
                  priority
                  sizes="(max-width: 900px) min(100vw - 40px, 360px), 420px"
                  src="/landing/hero.webp"
                  width={710}
                />
              </div>
            </div>
            <LandingSportPills />
          </section>
        </div>

        <main>
          <section className="lp-band lp-band-surface">
            <div className="lp-container">
              <h2>How it works</h2>
              <LandingTipGrid tips={howItWorksTips} />
            </div>
          </section>

          <section className="lp-split">
            <div className="lp-container lp-split-grid">
              <div className="lp-split-col">
                <h2>Host without the group chat</h2>
                <p>
                  Set capacity and approval once. Players request spots.
                  Waitlists fill dropouts automatically.
                </p>
                <Link className="lp-btn lp-btn-dark" href="/app">
                  Host a game
                </Link>
              </div>
              <div className="lp-split-col">
                <h2>Your contact stays private</h2>
                <p>
                  Contact details reach a host only after they approve you —
                  never posted publicly.
                </p>
                <Link className="lp-text-link" href="/how">
                  Privacy details
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            </div>
          </section>

          <section className="lp-band lp-compare-section">
            <div className="lp-container">
              <h2>Group chat vs. {siteName}</h2>
              <div className="lp-compare">
                <div className="lp-compare-head">
                  <span />
                  <span>Group chat</span>
                  <span className="highlight">{siteName}</span>
                </div>
                {compareRows.map((row) => (
                  <div className="lp-compare-row" key={row.label}>
                    <span>{row.label}</span>
                    <span className="lp-compare-cell">
                      <CompareMark value={row.chat} />
                    </span>
                    <span className="lp-compare-cell highlight">
                      <CompareMark value={row.gameon} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="lp-cta-dark">
            <div className="lp-container">
              <h2>The map is live</h2>
              <p>Browse without an account. Join when you&apos;re ready.</p>
              <Link className="lp-btn lp-btn-light" href="/app">
                See games near you
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </section>
        </main>

        <footer className="lp-footer">
          <div className="lp-container lp-footer-inner">
            <span>© 2026 {siteName}</span>
            <nav className="lp-footer-links" aria-label="Footer">
              <Link href="/app">Open map</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a
                href="https://gameon.userjot.com"
                rel="noopener noreferrer"
                target="_blank"
              >
                Feedback
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </LandingLocationProvider>
  );
}
