import { loadPastUserSportEvents } from "@/lib/data/sport-events";
import { createClient } from "@/lib/supabase/server";

export async function fetchPastSportEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return loadPastUserSportEvents(supabase, user.id);
}
