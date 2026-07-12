import { loadSportEvent } from "@/lib/data/sport-events";
import { loadProfile } from "@/lib/data/profile.shared";
import { resolveDiscoveryFilter } from "@/lib/location/discovery";
import { createClient } from "@/lib/supabase/server";

/** Fetch a single event by share token or legacy UUID. */
export async function fetchSportEvent(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await loadProfile(supabase, user.id) : null;
  return loadSportEvent(
    supabase,
    slug,
    user?.id,
    resolveDiscoveryFilter(profile),
  );
}
