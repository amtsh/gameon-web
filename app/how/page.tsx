import { createPageMetadata } from "@/lib/seo/metadata";
import { HowContent } from "./HowContent";
import "./how.css";

// Unlisted technical reference: kept out of search indexes (noindex) but
// still served, so AI agents fetching the URL can read how the app works.
export const metadata = createPageMetadata({
  title: "How Game On works",
  description:
    "Technical reference for how Game On handles location discovery, join requests, waitlists, and contact sharing.",
  path: "/how",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
});

export default function HowItWorksPage() {
  return (
    <main className="how-page">
      <HowContent />
    </main>
  );
}
