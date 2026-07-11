import type { User } from "@supabase/supabase-js";

/** Google OAuth avatar from Supabase user metadata. */
export function getUserAvatarUrl(user: User | null): string | undefined {
  if (!user?.user_metadata) return undefined;

  const { avatar_url: avatarUrl, picture } = user.user_metadata;

  if (typeof avatarUrl === "string" && avatarUrl.length > 0) return avatarUrl;
  if (typeof picture === "string" && picture.length > 0) return picture;

  return undefined;
}
