import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Crown,
  ListOrdered,
  MapPin,
  Share2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { siteName } from "@/lib/seo/metadata";
import { sports } from "../data/mock-data";
import "./landing.css";

export const metadata: Metadata = {
  title: "Pickup sports near you, on one map",
  description:
    "GameOn maps every pickup game around you. Tap a pin, request a spot, play. Hosts fill games without touching a group chat.",
  alternates: { canonical: "/landing" },
};

const problems = [
  {
    title: "Buried plans",
    body: "Thursday's game is 80 messages up in the chat, and the headcount is a pile of thumbs-ups.",
  },
  {
    title: "Invisible games",
    body: "Someone is playing your sport two blocks away tonight. You'll never hear about it.",
  },
  {
    title: "Empty spots",
    body: "One dropout the night before and the court is paid for nothing. Nobody is in line to take the spot.",
  },
];

const steps = [
  {
    title: "Open the map",
    body: "Every upcoming game within 25 km. Filter by sport. No account needed to look.",
  },
  {
    title: "Request a spot",
    body: "Two taps. The host approves you, or has auto-approve on and you're in immediately.",
  },
  {
    title: "Show up",
    body: "Calendar reminders before start, directions in one tap, host contact once you're in.",
  },
];

export default function LandingPage() {
  const marqueeChips = [...sports, ...sports];

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
          <Link className="lp-btn primary small" href="/">
            Open the app
            <ArrowRight size={15} />
          </Link>
        </nav>

        {/* Hero */}
        <header className="lp-hero">
          <div>
            <h1>
              There&apos;s a game near you <em>right now</em>.
            </h1>
            <p className="lp-hero-sub">
              GameOn maps every pickup game around you, badminton to
              five-a-side. Tap a pin, request a spot, play. Hosting? Your game
              fills itself.
            </p>
            <div className="lp-hero-ctas">
              <Link className="lp-btn primary" href="/">
                See games near you
                <ArrowRight size={16} />
              </Link>
              <Link className="lp-btn ghost" href="/">
                Host a game
              </Link>
            </div>
            <p className="lp-hero-note">
              Free. No install. Browse without an account.
            </p>
          </div>

          {/* Product mockup, hand-built so it never drifts from the brand */}
          <div className="lp-phone" aria-hidden="true">
            <div className="lp-phone-map">
              <span className="lp-pin" style={{ left: "22%", top: "30%", ["--pin-accent" as string]: "#63e6be" }}>🏸</span>
              <span className="lp-pin" style={{ left: "58%", top: "48%", ["--pin-accent" as string]: "#0a84ff" }}>⚽</span>
              <span className="lp-pin" style={{ left: "76%", top: "18%", ["--pin-accent" as string]: "#ff453a" }}>🏃</span>
            </div>
            <div className="lp-sheet">
              <div className="lp-sheet-grabber" />
              <div className="lp-row">
                <span className="lp-row-spots"><b>3</b><span>spots</span></span>
                <span>
                  <span className="lp-row-title">Evening doubles</span>
                  <span className="lp-row-meta" style={{ display: "block" }}>
                    Eriksdalshallen · Today 18:30 · 1.5h
                  </span>
                </span>
                <span className="lp-badge go">You are going</span>
              </div>
              <div className="lp-row">
                <span className="lp-row-spots"><b>0</b><span>spots</span></span>
                <span>
                  <span className="lp-row-title">Five-a-side football</span>
                  <span className="lp-row-meta" style={{ display: "block" }}>
                    Tantolunden · Tomorrow 17:00 · 1.5h
                  </span>
                </span>
                <span className="lp-badge wait">On waitlist</span>
              </div>
              <div className="lp-row">
                <span className="lp-row-spots"><b>8</b><span>spots</span></span>
                <span>
                  <span className="lp-row-title">Morning 5K loop</span>
                  <span className="lp-row-meta" style={{ display: "block" }}>
                    Norr Mälarstrand · Mon 07:15 · 45m
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Sport marquee */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {marqueeChips.map((sport, index) => (
            <span className="lp-chip" key={`${sport.id}-${index}`}>
              {sport.label}
            </span>
          ))}
        </div>
      </div>

      <div className="lp-container">
        {/* Problem */}
        <section className="lp-section">
          <p className="lp-kicker">The problem</p>
          <h2>Pickup sports run on group chats. Group chats lose games.</h2>
          <div className="lp-problems">
            {problems.map((problem) => (
              <article className="lp-problem" key={problem.title}>
                <h3>{problem.title}</h3>
                <p>{problem.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Solution bento */}
        <section className="lp-section">
          <p className="lp-kicker">The fix</p>
          <h2>Put the game on the map.</h2>
          <div className="lp-bento">
            <article className="lp-cell wide">
              <span className="accent" style={{ background: "#63e6be" }} />
              <span className="lp-cell-icon"><MapPin size={20} /></span>
              <h3>Every game, pinned</h3>
              <p>
                Upcoming games within 25 km, shown where they happen, with
                spots left at a glance.
              </p>
            </article>
            <article className="lp-cell narrow">
              <span className="lp-cell-icon"><ShieldCheck size={20} /></span>
              <h3>Hosts stay in control</h3>
              <p>
                Approve each request, or turn on auto-approve and let the game
                fill itself.
              </p>
            </article>
            <article className="lp-cell narrow">
              <span className="lp-cell-icon"><ListOrdered size={20} /></span>
              <h3>A waitlist that works</h3>
              <p>
                Full game? You&apos;re in line. A dropout promotes the next
                player automatically.
              </p>
            </article>
            <article className="lp-cell wide">
              <span className="accent" style={{ background: "#0a84ff" }} />
              <span className="lp-cell-icon"><Share2 size={20} /></span>
              <h3>One link fills a game</h3>
              <p>
                Drop your game link in any chat. Friends join from the link —
                sign-up happens on the way in, not before.
              </p>
            </article>
            <article className="lp-cell half">
              <span className="lp-cell-icon"><CalendarClock size={20} /></span>
              <h3>No no-shows</h3>
              <p>Add to calendar with reminders 24 hours and 1 hour before.</p>
            </article>
            <article className="lp-cell half">
              <span className="lp-cell-icon"><Crown size={20} /></span>
              <h3>Weekly game? One tap</h3>
              <p>
                Re-host last week&apos;s session, rolled forward a week.
                Contact details are shared only after approval.
              </p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section">
          <p className="lp-kicker">How it works</p>
          <h2>From &ldquo;anyone playing?&rdquo; to playing.</h2>
          <div className="lp-steps">
            {steps.map((step) => (
              <div className="lp-step" key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-final">
          <h2>The map is live.</h2>
          <p>Browse without an account. Join in two taps.</p>
          <Link className="lp-btn" href="/">
            Open {siteName}
            <ArrowRight size={16} />
          </Link>
        </section>

        <footer className="lp-footer">
          <span>© 2026 {siteName}</span>
          <span style={{ display: "inline-flex", gap: 16 }}>
            <Link href="/">Open app</Link>
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
