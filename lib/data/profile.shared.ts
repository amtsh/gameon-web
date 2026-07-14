import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const PROFILE_COLUMNS =
  "id, name, is_onboarding_complete, location_mode, postal_code, " +
  "postal_latitude, postal_longitude, contact_method, contact_value, " +
  "created_at, updated_at";

export async function loadProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle()
    .overrideTypes<Profile | null, { merge: false }>();

  if (error) throw error;
  return data;
}
