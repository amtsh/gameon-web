import { loadSportEvent, loadSportEvents } from "@/lib/data/sport-events";
import { resolveDiscoveryFilter, type DiscoveryFilter } from "@/lib/location/discovery";
import { loadProfile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/server";

async function discoveryForUser(userId: string | undefined) {
  if (!userId) return resolveDiscoveryFilter(null);
  const supabase = await createClient();
  const profile = await loadProfile(supabase, userId);
  return resolveDiscoveryFilter(profile);
}

/** Fetch upcoming sport events within the discovery radius (server). */
export async function fetchSportEvents(discovery?: DiscoveryFilter) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const filter = discovery ?? (await discoveryForUser(user?.id));
  return loadSportEvents(supabase, user?.id, filter);
}

/** Fetch a single event by ID — no radius filter (share links). */
export async function fetchSportEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const filter = await discoveryForUser(user?.id);
  return loadSportEvent(supabase, eventId, user?.id, filter);
}
