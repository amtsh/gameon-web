import type { User } from "@supabase/supabase-js";
import type { SportEvent } from "@/app/types";
import {
  loadPastUserSportEvents,
  loadSportEvent,
  loadSportEvents,
} from "@/lib/data/sport-events";
import { loadProfile, type Profile } from "@/lib/data/profile.shared";
import { resolveDiscoveryFilter } from "@/lib/location/discovery";
import { createClient } from "@/lib/supabase/server";

export type AppData = {
  user: User | null;
  profile: Profile | null;
  events: SportEvent[];
  pastEvents: SportEvent[];
  /** Only set when sharedEventId was passed; null = not found. */
  sharedEvent?: SportEvent | null;
};

/** Everything the app shell needs for SSR — one client, one auth lookup,
    one profile load, instead of each fetcher redoing all three. */
export async function loadAppData(sharedEventId?: string): Promise<AppData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await loadProfile(supabase, user.id) : null;
  const discovery = resolveDiscoveryFilter(profile);

  const [events, pastEvents, sharedEvent] = await Promise.all([
    loadSportEvents(supabase, user?.id, discovery),
    user ? loadPastUserSportEvents(supabase, user.id) : Promise.resolve([]),
    sharedEventId
      ? loadSportEvent(supabase, sharedEventId, user?.id, discovery)
      : Promise.resolve(undefined),
  ]);

  return { user, profile, events, pastEvents, sharedEvent };
}
