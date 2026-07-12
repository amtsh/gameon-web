import type { Profile } from "@/lib/data/profile.shared";
import { sportEventSharePath } from "@/lib/share-token";

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

export function joinGuideReturnPath(
  shareToken: string,
  isPrivate = false,
): string {
  return `${sportEventSharePath(shareToken, { isPrivate })}?join=1`;
}
