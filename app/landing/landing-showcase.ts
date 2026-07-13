import type { LucideIcon } from "lucide-react";

export type LandingShowcaseIconVariant = "rose" | "sky" | "violet";

export type LandingShowcaseItem = {
  title: string;
  body: string;
  icon: LucideIcon;
  iconVariant: LandingShowcaseIconVariant;
};
