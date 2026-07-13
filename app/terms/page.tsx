import { createPageMetadata } from "@/lib/seo/metadata";
import { TermsContent } from "./TermsContent";
import "../legal.css";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description: "Rules and responsibilities for using Game On.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main className="legal-page">
      <TermsContent />
    </main>
  );
}
