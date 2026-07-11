import type { User } from "@supabase/supabase-js";

/** user_metadata is end-user writable via the auth API, so never trust it
    blindly in an img src — accept https URLs only. */
function safeHttpsUrl(candidate: unknown): string | undefined {
  if (typeof candidate !== "string" || candidate.length === 0) return undefined;
  try {
    return new URL(candidate).protocol === "https:" ? candidate : undefined;
  } catch {
    return undefined;
  }
}

/** Google OAuth avatar from Supabase user metadata. */
export function getUserAvatarUrl(user: User | null): string | undefined {
  if (!user?.user_metadata) return undefined;

  return (
    safeHttpsUrl(user.user_metadata.avatar_url) ??
    safeHttpsUrl(user.user_metadata.picture)
  );
}
