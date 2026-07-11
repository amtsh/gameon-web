import { fetchProfile } from "@/lib/data/profile";
import { fetchSportEvents } from "@/lib/data/events";
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

  if (user) {
    initialProfile = await fetchProfile();
  }

  const initialEvents = await fetchSportEvents();

  return (
    <GameOnApp
      initialEvents={initialEvents}
      initialProfile={initialProfile}
      initialUser={user}
      usesSupabase={true}
    />
  );
}
