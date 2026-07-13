import type { User } from "@supabase/supabase-js";
import type { SportEvent } from "@/app/types";
import {
  loadPastUserSportEvents,
  loadSportEventForSeo,
  loadSportEvents,
} from "@/lib/data/sport-events";
import { loadProfile, type Profile } from "@/lib/data/profile.shared";
import { initialDiscoveryFilter } from "@/lib/location/discovery";
import type { Coordinates } from "@/lib/location/geo";
import { readIpCoordinatesFromHeaderMap } from "@/lib/location/ip-geo";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AppData = {
  user: User | null;
  profile: Profile | null;
  events: SportEvent[];
  pastEvents: SportEvent[];
  /** Session IP fix from edge headers — passed to client, not persisted. */
  ipLocation: Coordinates | null;
  /** Only set when sharedEventSlug was passed; null = not found. */
  sharedEvent?: SportEvent | null;
};

/** Everything the app shell needs for SSR — one client, one auth lookup,
    one profile load, instead of each fetcher redoing all three. */
export async function loadAppData(sharedEventSlug?: string): Promise<AppData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await loadProfile(supabase, user.id) : null;
  const ipLocation = readIpCoordinatesFromHeaderMap(await headers());
  const discovery = initialDiscoveryFilter(profile, ipLocation);

  const [events, pastEvents, sharedEvent] = await Promise.all([
    loadSportEvents(supabase, user?.id, discovery),
    user ? loadPastUserSportEvents(supabase, user.id) : Promise.resolve([]),
    sharedEventSlug
      ? loadSportEventForSeo(sharedEventSlug)
      : Promise.resolve(undefined),
  ]);

  return { user, profile, events, pastEvents, ipLocation, sharedEvent };
}
