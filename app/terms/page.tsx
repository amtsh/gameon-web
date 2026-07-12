import type { Metadata } from "next";
import { TermsContent } from "./TermsContent";
import "../legal.css";

export const metadata: Metadata = {
  title: "Terms of Service – GameOn",
  description: "Rules and responsibilities for using GameOn.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <TermsContent />
    </main>
  );
}
