import { loadProfile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/server";

export type { Profile } from "@/lib/data/profile.shared";

export async function fetchProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return loadProfile(supabase, user.id);
}
