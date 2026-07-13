import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { DISCOVERY_RADIUS_KM } from "@/lib/location/constants";
import { resolveInitialDiscoveryLocationLabel } from "@/lib/location/discovery";
import { readIpCoordinatesFromHeaderMap } from "@/lib/location/ip-geo";
import { siteName } from "@/lib/seo/metadata";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { loadAppData } from "@/lib/data/app-data";
import { LandingCity, LandingLocationProvider } from "./landing/LandingCity";
import { CompareMark } from "./landing/CompareMark";
import { LandingSportPills } from "./landing/LandingSportPills";
import { HeroBackground } from "./landing/HeroBackground";
import "./landing.css";

export const metadata: Metadata = {
  title: "Find a game near you",
  description:
    "Game On maps local sports games around you. Tap a pin, request a spot, play.",
  alternates: { canonical: "/" },
};

const products = [
  {
    title: "Play",
    body: "See open games near you. Request a spot in two taps.",
    href: "/home",
    cta: "Find a game",
  },
  {
    title: "Host",
    body: "Publish once. Requests and waitlists fill the roster.",
    href: "/home",
    cta: "Host a game",
  },
];

const steps = [
  {
    n: "1",
    title: "Open the map",
    body: `Games within ${DISCOVERY_RADIUS_KM} km. Filter by sport.`,
  },
  {
    n: "2",
    title: "Request a spot",
    body: "Host approves you, or auto-approve puts you in.",
  },
  {
    n: "3",
    title: "Show up",
    body: "Reminders, directions, and host contact once you're in.",
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
      redirect("/home");
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
                {siteName}
              </Link>
              <div className="lp-top-actions">
                <LandingCity className="lp-city" />
                <Link className="lp-btn lp-btn-dark lp-btn-sm" href="/home">
                  Open map
                </Link>
              </div>
            </div>
          </header>

          <section className="lp-hero">
            <div className="lp-container lp-hero-grid">
              <div className="lp-hero-copy">
                <h1>Find a game near you</h1>
                <p className="lp-hero-sub">
                  Local sports on one map. Request a spot. Show up.
                </p>

                <form className="lp-request" action="/home" method="get">
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
          <section className="lp-band">
            <div className="lp-container">
              <h2>What you can do</h2>
              <div className="lp-product-row">
                {products.map((item) => (
                  <article className="lp-product-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <Link className="lp-text-link" href={item.href}>
                      {item.cta}
                      <ArrowRight size={15} aria-hidden />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="lp-band">
            <div className="lp-container">
              <h2>How it works</h2>
              <div className="lp-steps">
                {steps.map((step) => (
                  <article className="lp-step" key={step.n}>
                    <span className="lp-step-n" aria-hidden>
                      {step.n}
                    </span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                ))}
              </div>
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
                <Link className="lp-btn lp-btn-dark" href="/home">
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
              <Link className="lp-btn lp-btn-light" href="/home">
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
              <Link href="/home">Open map</Link>
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
