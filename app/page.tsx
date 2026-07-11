import { fetchPastSportEvents } from "@/lib/data/events-past";
import { fetchSportEvents } from "@/lib/data/events";
import { fetchProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import GameOnApp from "./gameon-app";
import { mockEvents } from "./data/mock-data";
import type { Profile } from "@/lib/data/profile.shared";

export default async function Home() {
  if (!hasSupabaseEnv()) {
    return (
      <GameOnApp
        initialEvents={mockEvents}
        initialPastEvents={[]}
        initialProfile={null}
        initialUser={null}
        usesSupabase={false}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialProfile: Profile | null = null;
  let initialPastEvents: Awaited<ReturnType<typeof fetchPastSportEvents>> = [];

  if (user) {
    [initialProfile, initialPastEvents] = await Promise.all([
      fetchProfile(),
      fetchPastSportEvents(),
    ]);
  }

  const initialEvents = await fetchSportEvents();

  return (
    <GameOnApp
      initialEvents={initialEvents}
      initialPastEvents={initialPastEvents}
      initialProfile={initialProfile}
      initialUser={user}
      usesSupabase={true}
    />
  );
}
