import { loadSportEvent, loadSportEvents } from "@/lib/data/sport-events";
import { createClient } from "@/lib/supabase/server";

/** Fetch upcoming sport events with viewer-specific flags (server). */
export async function fetchSportEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return loadSportEvents(supabase, user?.id);
}

/** Fetch a single upcoming sport event for shareable detail pages (server). */
export async function fetchSportEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return loadSportEvent(supabase, eventId, user?.id);
}
