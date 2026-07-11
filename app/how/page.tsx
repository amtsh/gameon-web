import type { Metadata } from "next";
import { HowContent } from "./HowContent";
import "./how.css";

// Unlisted technical reference: kept out of search indexes (noindex) but
// still served, so AI agents fetching the URL can read how the app works.
export const metadata: Metadata = {
  title: "How GameOn works",
  description:
    "Technical reference for how GameOn handles location discovery, join requests, waitlists, and contact sharing.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: "/how" },
};

export default function HowItWorksPage() {
  return (
    <main className="how-page">
      <HowContent />
    </main>
  );
}
