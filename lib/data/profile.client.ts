import { loadProfile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/client";

export type { Profile } from "@/lib/data/profile.shared";

export async function fetchProfileClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return loadProfile(supabase, user.id);
}
