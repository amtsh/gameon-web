import { loadSportEvents } from "@/lib/data/sport-events";
import { createClient } from "@/lib/supabase/client";

/** Fetch events after client-side auth changes. */
export async function fetchSportEventsClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return loadSportEvents(supabase, user?.id);
}
