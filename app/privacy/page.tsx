import { createPageMetadata } from "@/lib/seo/metadata";
import { PrivacyContent } from "./PrivacyContent";
import "../legal.css";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "How Game On collects, uses, and protects your personal data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <PrivacyContent />
    </main>
  );
}
