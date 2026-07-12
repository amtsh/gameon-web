import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ListOrdered,
  Lock,
  MapPin,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { siteName } from "@/lib/seo/metadata";
import { sports } from "./data/mock-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { loadAppData } from "@/lib/data/app-data";
import "./landing.css";

export const metadata: Metadata = {
  title: "Local sports games near you, on one map",
  description:
    "GameOn maps every local game around you. Tap a pin, request a spot, play. Hosts fill games without touching a group chat.",
  alternates: { canonical: "/" },
};

const steps = [
  {
    icon: MapPin,
    title: "Open the map",
    body: "Every upcoming game within 25 km. Filter by sport. No account needed to look.",
  },
  {
    icon: ShieldCheck,
    title: "Request a spot",
    body: "Two taps. The host approves you, or has auto-approve on and you're in immediately.",
  },
  {
    icon: CalendarClock,
    title: "Show up",
    body: "Calendar reminders before start, directions in one tap, host contact once you're in.",
  },
];

const features = [
  {
    icon: ListOrdered,
    title: "A waitlist that works",
    body: "Full game? You're in line. A dropout promotes the next player automatically.",
  },
  {
    icon: Lock,
    title: "Contact stays private",
    body: "Your number is shared with a host only once they approve you.",
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
  // Signed-in users have no reason to see the landing page — take them
  // straight to the app.
  if (hasSupabaseEnv()) {
    const { user } = await loadAppData();
    if (user) {
      redirect("/home");
    }
  }

  return (
    <div className="lp">
      <div className="lp-container">
        <nav className="lp-nav" aria-label="Landing">
          <span className="lp-logo">
            <span className="lp-logo-dot">
              <Zap size={15} strokeWidth={2.6} />
            </span>
            {siteName}
          </span>
          <Link className="lp-btn primary small" href="/home">
            Open the app
            <ArrowRight size={15} />
          </Link>
        </nav>

        <header className="lp-hero">
          <h1>
            There&apos;s a game near you <em>right now</em>.
          </h1>
          <div className="lp-hero-sub">
            <p>Every local sports game, on one map.</p>
            <p>Tap a pin. Request a spot. Play.</p>
            <p>Hosting? Your game fills itself.</p>
          </div>
          <div className="lp-hero-ctas">
            <Link className="lp-btn primary" href="/home">
              See games near you
              <ArrowRight size={16} />
            </Link>
            <Link className="lp-btn ghost" href="/home">
              Host a game
            </Link>
          </div>
          <p className="lp-hero-note">
            Free. No install. Browse without an account.
          </p>
        </header>

        <div className="lp-hero-visual">
          <Image
            alt="GameOn map with nearby pickup games and a bottom sheet listing open games"
            className="lp-hero-image"
            height={1398}
            priority
            src="/landing/hero.webp"
            width={710}
          />
        </div>
      </div>

      <div className="lp-container">
        <section className="lp-section lp-section-problem">
          <p className="lp-kicker">The problem</p>
          <h2>Local games run on group chats. Group chats lose games.</h2>
          <p className="lp-section-sub">
            Someone is playing your sport two blocks away tonight. Request a
            spot in two taps — the host approves you, and your contact info goes
            out only then.
          </p>
        </section>
      </div>

      <section className="lp-dark-section">
        <div className="lp-container lp-dark-split">
          <div className="lp-stat-card">
            <span className="lp-stat-number">{sports.length}</span>
            <span className="lp-stat-label">sports live on the map</span>
            <p className="lp-stat-body">
              Badminton to five-a-side, all pinned where they actually
              happen, updated the moment a host publishes a game.
            </p>
          </div>
          <div className="lp-sport-grid">
            {sports.map((sport) => (
              <span
                className="lp-sport-tile"
                key={sport.id}
                style={{ ["--tile-accent" as string]: sport.accent }}
              >
                <Icon icon={sport.icon} width={22} />
                {sport.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-container">
        <section className="lp-section">
          <p className="lp-kicker center">How it works</p>
          <h2 className="center">From &ldquo;anyone playing?&rdquo; to playing.</h2>
          <div className="lp-icon-row cols-3">
            {steps.map((step) => (
              <div className="lp-icon-item" key={step.title}>
                <span className="lp-icon-circle">
                  <step.icon size={22} strokeWidth={2} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <p className="lp-kicker center">Built for real games</p>
          <h2 className="center">The pieces that keep games full.</h2>
          <div className="lp-icon-row cols-2">
            {features.map((feature) => (
              <div className="lp-icon-item" key={feature.title}>
                <span className="lp-icon-circle">
                  <feature.icon size={22} strokeWidth={2} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="lp-privacy">
        <div className="lp-container lp-privacy-inner">
          <p className="lp-kicker center on-dark">Privacy</p>
          <h2 className="center">Your number is yours.</h2>
          <p className="lp-section-sub center on-dark">
            GameOn never posts your phone number, WhatsApp, or Telegram in
            public. It reaches a host only once they approve your request —
            and only that host.
          </p>
          <span className="lp-privacy-mark" aria-hidden="true">
            <Zap size={36} strokeWidth={2.4} />
          </span>
        </div>
      </section>

      <div className="lp-container">
        <section className="lp-section">
          <p className="lp-kicker center">Game school</p>
          <h2 className="center">Group chat vs. GameOn.</h2>
          <div className="lp-compare">
            <div className="lp-compare-head">
              <span />
              <span>Group chat</span>
              <span className="highlight">{siteName}</span>
            </div>
            {compareRows.map((row) => (
              <div className="lp-compare-row" key={row.label}>
                <span>{row.label}</span>
                <span className={row.chat ? "yes" : "no"}>
                  {row.chat ? "✓" : "—"}
                </span>
                <span className={row.gameon ? "yes highlight" : "no"}>
                  {row.gameon ? "✓" : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-final">
          <h2>The map is live.</h2>
          <p>Browse without an account. Join in two taps.</p>
          <Link className="lp-btn" href="/home">
            Open {siteName}
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="lp-footer">
          <span>© 2026 {siteName}</span>
          <span style={{ display: "inline-flex", gap: 16 }}>
            <Link href="/home">Open app</Link>
            <a
              href="https://gameon.userjot.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Feedback
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
