import type { User } from "@supabase/supabase-js";
import { safeHttpsUrl } from "@/lib/validation/url";

/** Google OAuth avatar from Supabase user metadata. */
export function getUserAvatarUrl(user: User | null): string | undefined {
  if (!user?.user_metadata) return undefined;

  return (
    safeHttpsUrl(user.user_metadata.avatar_url) ??
    safeHttpsUrl(user.user_metadata.picture)
  );
}
