"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth/google";
import { getUserAvatarUrl } from "@/lib/auth/user";
import {
  fetchPastSportEventsClient,
  fetchSportEventsClient,
} from "@/lib/data/events.client";
import { fetchProfileClient } from "@/lib/data/profile.client";
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
  initialPastEvents: SportEvent[];
  initialUser: User | null;
  initialProfile: Profile | null;
  usesSupabase: boolean;
};

export default function GameOnApp({
  initialEvents,
  initialPastEvents,
  initialUser,
  initialProfile,
  usesSupabase,
}: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [pastEvents, setPastEvents] = useState(initialPastEvents);
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [authBusy, setAuthBusy] = useState(false);
  const [selectedSports, setSelectedSports] = useState<SportKind[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  // Track which sheet opened ContactSheet so we can return to it on dismiss.
  const contactReturnSheet = useRef<SheetName>(null);
  const [showingPast, setShowingPast] = useState(false);
  const [locateToken, setLocateToken] = useState(0);
  const [detailEvent, setDetailEvent] = useState<SportEvent | undefined>();
  const [detailPresented, setDetailPresented] = useState(false);
  const [editEvent, setEditEvent] = useState<SportEvent | undefined>();
  const [gamesDetent, setGamesDetent] = useState(1);
  const onboardingShown = useRef(false);

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
      setPastEvents([]);
      return;
    }

    const [nextProfile, nextPast] = await Promise.all([
      fetchProfileClient(),
      fetchPastSportEventsClient(),
    ]);
    setProfile(nextProfile);
    setPastEvents(nextPast);

    setDetailEvent((current) => {
      if (!current) return current;
      const updated = [...nextEvents, ...nextPast].find(
        (event) => event.id === current.id,
      );
      return updated ?? current;
    });
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

  useEffect(() => {
    if (!usesSupabase) return;

    const supabase = createClient();
    const channel = supabase
      .channel("gameon-public-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sport_events" },
        () => {
          void refreshSessionData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_participants" },
        () => {
          void refreshSessionData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_join_requests" },
        () => {
          void refreshSessionData();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshSessionData, usesSupabase]);

  useEffect(() => {
    if (
      !user ||
      !profile ||
      profile.is_onboarding_complete ||
      onboardingShown.current
    ) {
      return;
    }
    onboardingShown.current = true;
    setActiveSheet("profile");
  }, [profile, user]);

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
      setEditEvent(undefined);
      await refreshSessionData();
    } finally {
      setAuthBusy(false);
    }
  }, [refreshSessionData]);

  const openCreate = useCallback(() => {
    setEditEvent(undefined);
    setActiveSheet("create");
  }, []);

  const openEdit = useCallback((event: SportEvent) => {
    setEditEvent(event);
    setActiveSheet("create");
  }, []);

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

  // Open the detail sheet immediately; the games sheet collapses to half
  // (if it was full) in parallel, in the background, so the detail sheet
  // never waits on it.
  const selectEvent = useCallback((event: SportEvent) => {
    setDetailEvent(event);
    setDetailPresented(true);
    setGamesDetent(1);
  }, []);

  const handleGamesDetentChange = useCallback((detent: number) => {
    setGamesDetent(Math.max(1, detent));
  }, []);

  const openContact = useCallback((returnTo: SheetName) => {
    contactReturnSheet.current = returnTo;
    setActiveSheet("contact");
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
        pastEvents={pastEvents}
        isSignedIn={Boolean(user)}
        avatarUrl={getUserAvatarUrl(user)}
        selectedSports={selectedSports}
        showingPast={showingPast}
        activeDetent={gamesDetent}
        onActiveDetentChange={handleGamesDetentChange}
        onToggleSport={toggleSport}
        onShowAll={showAll}
        onShowPast={showPast}
        onSelectEvent={selectEvent}
        onOpenSheet={(sheet) => {
          if (sheet === "create") {
            requireAuth(openCreate);
            return;
          }
          setActiveSheet(sheet);
        }}
      />

      {detailEvent ? (
        <EventDetailSheet
          event={detailEvent}
          profile={profile}
          isSignedIn={Boolean(user)}
          presented={detailPresented}
          onPresentedChange={setDetailPresented}
          onRequireSignIn={() => setActiveSheet("profile")}
          onEdit={openEdit}
          onMutated={refreshSessionData}
        />
      ) : null}
      <CreateEventSheet
        presented={activeSheet === "create"}
        onPresentedChange={(presented) => {
          if (!presented) setEditEvent(undefined);
          setActiveSheet(presented ? "create" : null);
        }}
        onContact={() => openContact("create")}
        profile={profile}
        editEvent={editEvent}
        onSaved={refreshSessionData}
      />
      <ProfileSheet
        presented={activeSheet === "profile"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "profile" : null)
        }
        onContact={() => openContact("profile")}
        user={user}
        profile={profile}
        authBusy={authBusy}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onSaved={refreshSessionData}
      />
      <ContactSheet
        presented={activeSheet === "contact"}
        onPresentedChange={(presented) => {
          if (presented) {
            setActiveSheet("contact");
          } else {
            // Return to whichever sheet opened the contact editor.
            setActiveSheet(contactReturnSheet.current);
          }
        }}
        profile={profile}
        onSaved={refreshSessionData}
      />
    </main>
  );
}
