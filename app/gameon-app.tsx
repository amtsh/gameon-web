"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth/google";
import { fetchProfileClient } from "@/lib/data/profile.client";
import { fetchSportEventsClient } from "@/lib/data/events.client";
import { createClient } from "@/lib/supabase/client";
import { AppMap } from "./components/AppMap";
import { ContactSheet } from "./components/ContactSheet";
import { CreateEventSheet } from "./components/CreateEventSheet";
import { EventDetailSheet } from "./components/EventDetailSheet";
import { FloatingActions } from "./components/FloatingActions";
import { GamesSheet } from "./components/GamesSheet";
import { ProfileSheet } from "./components/ProfileSheet";
import type { Profile } from "@/lib/data/profile.shared";
import type { SheetName, SportEvent, SportKind } from "./types";

type Props = {
  initialEvents: SportEvent[];
  initialUser: User | null;
  initialProfile: Profile | null;
  usesSupabase: boolean;
};

export default function GameOnApp({
  initialEvents,
  initialUser,
  initialProfile,
  usesSupabase,
}: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [authBusy, setAuthBusy] = useState(false);
  const [selectedSports, setSelectedSports] = useState<SportKind[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [showingPast, setShowingPast] = useState(false);
  const [locateToken, setLocateToken] = useState(0);
  const [detailEvent, setDetailEvent] = useState<SportEvent | undefined>();
  const [detailPresented, setDetailPresented] = useState(false);

  const refreshSessionData = useCallback(async () => {
    if (!usesSupabase) return;

    const supabase = createClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    setUser(nextUser);

    const nextEvents = await fetchSportEventsClient();
    setEvents(nextEvents);

    if (!nextUser) {
      setProfile(null);
      return;
    }

    setProfile(await fetchProfileClient());
  }, [usesSupabase]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
        return;
      }
      setActiveSheet("profile");
    },
    [user],
  );

  useEffect(() => {
    if (!usesSupabase) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshSessionData();
    });

    return () => subscription.unsubscribe();
  }, [refreshSessionData, usesSupabase]);

  const handleSignIn = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signOut();
      setActiveSheet(null);
      await refreshSessionData();
    } finally {
      setAuthBusy(false);
    }
  }, [refreshSessionData]);

  const toggleSport = useCallback((sport: SportKind) => {
    setShowingPast(false);
    setSelectedSports((current) =>
      current.includes(sport)
        ? current.filter((candidate) => candidate !== sport)
        : [...current, sport],
    );
  }, []);

  const showAll = useCallback(() => {
    setShowingPast(false);
    setSelectedSports([]);
  }, []);

  const showPast = useCallback(() => setShowingPast(true), []);

  const selectEvent = useCallback((event: SportEvent) => {
    setDetailEvent(event);
    setDetailPresented(true);
  }, []);

  return (
    <main className="gameon-root">
      <AppMap
        events={events}
        selectedEvent={detailPresented ? detailEvent : undefined}
        locateToken={locateToken}
        onSelect={selectEvent}
      />
      <FloatingActions
        onLocate={() => setLocateToken((token) => token + 1)}
      />
      <GamesSheet
        events={events}
        isSignedIn={Boolean(user)}
        selectedSports={selectedSports}
        showingPast={showingPast}
        onToggleSport={toggleSport}
        onShowAll={showAll}
        onShowPast={showPast}
        onSelectEvent={selectEvent}
        onOpenSheet={(sheet) => {
          if (sheet === "create") {
            requireAuth(() => setActiveSheet("create"));
            return;
          }
          setActiveSheet(sheet);
        }}
      />

      {detailEvent ? (
        <EventDetailSheet
          event={detailEvent}
          isSignedIn={Boolean(user)}
          presented={detailPresented}
          onPresentedChange={setDetailPresented}
          onRequireSignIn={() => setActiveSheet("profile")}
        />
      ) : null}
      <CreateEventSheet
        presented={activeSheet === "create"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "create" : null)
        }
        profile={profile}
        onCreated={refreshSessionData}
      />
      <ProfileSheet
        presented={activeSheet === "profile"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "profile" : null)
        }
        onContact={() => setActiveSheet("contact")}
        user={user}
        profile={profile}
        authBusy={authBusy}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />
      <ContactSheet
        presented={activeSheet === "contact"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "contact" : "profile")
        }
      />
    </main>
  );
}
