import {
  loadPastUserSportEvents,
  loadSportEvents,
} from "@/lib/data/sport-events";
import { createClient } from "@/lib/supabase/client";

export async function fetchSportEventsClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return loadSportEvents(supabase, user?.id);
}

export async function fetchPastSportEventsClient() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return loadPastUserSportEvents(supabase, user.id);
}
