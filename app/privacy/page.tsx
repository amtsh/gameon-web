import type { Metadata } from "next";
import { PrivacyContent } from "./PrivacyContent";
import "../legal.css";

export const metadata: Metadata = {
  title: "Privacy Policy – GameOn",
  description: "How GameOn collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <PrivacyContent />
    </main>
  );
}
