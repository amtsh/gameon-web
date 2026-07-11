import type { Profile } from "@/lib/data/profile.shared";

export type JoinGuideStep = "signIn" | "contact";

export function hasJoinContact(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.contact_method && profile?.contact_value?.trim());
}

export function getJoinGuideStep(
  isSignedIn: boolean,
  profile: Profile | null | undefined,
): JoinGuideStep | null {
  if (!isSignedIn) return "signIn";
  if (!hasJoinContact(profile)) return "contact";
  return null;
}

export function joinGuideReturnPath(eventId: string): string {
  return `/game/${eventId}?join=1`;
}
