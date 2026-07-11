import {
  loadPastUserSportEvents,
  loadSportEvents,
} from "@/lib/data/sport-events";
import type { DiscoveryFilter } from "@/lib/location/discovery";
import { createClient } from "@/lib/supabase/client";

export async function fetchSportEventsClient(discovery: DiscoveryFilter) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return loadSportEvents(supabase, user?.id, discovery);
}

export async function fetchPastSportEventsClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return loadPastUserSportEvents(supabase, user.id);
}
