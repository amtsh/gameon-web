"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth/google";
import { getUserAvatarUrl } from "@/lib/auth/user";
import {
  fetchPastSportEventsClient,
  fetchSportEventsClient,
} from "@/lib/data/events.client";
import { fetchProfileClient } from "@/lib/data/profile.client";
import {
  saveDiscoveryCoordinates,
} from "@/lib/data/profile-mutations.client";
import {
  getDeviceCoordinates,
  resolveClientDiscoveryFilter,
  storeDiscoveryCenter,
} from "@/lib/location/discovery.client";
import { DISCOVERY_RADIUS_KM } from "@/lib/location/constants";
import { pickLatestHostedEvent } from "@/lib/create-event/prefill";
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
  /** Defined: open detail sheet. null: show "not found" state. undefined: normal home. */
  initialSharedEvent?: SportEvent | null;
  usesSupabase: boolean;
};

export default function GameOnApp({
  initialEvents,
  initialPastEvents,
  initialUser,
  initialProfile,
  initialSharedEvent = undefined,
  usesSupabase,
}: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [pastEvents, setPastEvents] = useState(initialPastEvents);
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [authBusy, setAuthBusy] = useState(false);
  const [selectedSports, setSelectedSports] = useState<SportKind[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const contactReturnSheet = useRef<SheetName>(null);
  const [showingPast, setShowingPast] = useState(false);
  const [locateToken, setLocateToken] = useState(0);
  const [detailEvent, setDetailEvent] = useState<SportEvent | undefined>(
    initialSharedEvent ?? undefined,
  );
  const [detailPresented, setDetailPresented] = useState(
    Boolean(initialSharedEvent),
  );
  const [editEvent, setEditEvent] = useState<SportEvent | undefined>();
  const [gamesDetent, setGamesDetent] = useState(1);
  const onboardingShown = useRef(false);

  // true when the URL was /game/[id] but the event does not exist.
  const showingSharedMissing = initialSharedEvent === null;

  const refreshSessionData = useCallback(async () => {
    if (!usesSupabase) return;

    const supabase = createClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    setUser(nextUser);

    const nextProfile = nextUser ? await fetchProfileClient() : null;
    setProfile(nextProfile);

    const discovery = await resolveClientDiscoveryFilter(nextProfile);
    const [nextEvents, nextPast] = await Promise.all([
      fetchSportEventsClient(discovery),
      nextUser ? fetchPastSportEventsClient() : Promise.resolve([]),
    ]);
    setEvents(nextEvents);
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
      if (user) { action(); return; }
      setActiveSheet("profile");
    },
    [user],
  );

  useEffect(() => {
    if (!usesSupabase) return;
    void (async () => {
      const discovery = await resolveClientDiscoveryFilter(profile);
      setEvents(await fetchSportEventsClient(discovery));
    })();
  }, [usesSupabase, profile?.postal_latitude, profile?.postal_longitude]);

  useEffect(() => {
    if (!usesSupabase) return;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void refreshSessionData();
    });
    return () => subscription.unsubscribe();
  }, [refreshSessionData, usesSupabase]);

  useEffect(() => {
    if (!usesSupabase) return;
    const supabase = createClient();
    const channel = supabase
      .channel("gameon-public-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sport_events" }, () => { void refreshSessionData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_participants" }, () => { void refreshSessionData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_join_requests" }, () => { void refreshSessionData(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_waitlist" }, () => { void refreshSessionData(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [refreshSessionData, usesSupabase]);

  useEffect(() => {
    if (!user || !profile || profile.is_onboarding_complete || onboardingShown.current) return;
    if (initialSharedEvent !== undefined) return;
    onboardingShown.current = true;
    setActiveSheet("profile");
  }, [initialSharedEvent, profile, user]);

  const handleSignIn = useCallback(async () => {
    setAuthBusy(true);
    try { await signInWithGoogle(); } finally { setAuthBusy(false); }
  }, []);

  const handleSignOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signOut();
      setActiveSheet(null);
      setEditEvent(undefined);
      await refreshSessionData();
    } finally { setAuthBusy(false); }
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

  const handleViewOtherGames = useCallback(() => {
    setSelectedSports([]);
    setShowingPast(false);
    setDetailEvent(undefined);
    setDetailPresented(false);
    setGamesDetent(1);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const handleLocate = useCallback(async () => {
    setLocateToken((token) => token + 1);
    if (!usesSupabase) return;

    try {
      const center = await getDeviceCoordinates();
      storeDiscoveryCenter(center);
      if (user) {
        await saveDiscoveryCoordinates(center);
        setProfile(await fetchProfileClient());
      }
      setEvents(
        await fetchSportEventsClient({
          center,
          radiusKm: DISCOVERY_RADIUS_KM,
        }),
      );
    } catch {
      // Map still flies via locateToken.
    }
  }, [usesSupabase, user]);

  const mapEvents = useMemo(() => {
    if (!detailEvent) return events;
    if (events.some((event) => event.id === detailEvent.id)) return events;
    return [...events, detailEvent];
  }, [events, detailEvent]);

  const lastHostedEvent = useMemo(
    () => pickLatestHostedEvent([...events, ...pastEvents]),
    [events, pastEvents],
  );

  return (
    <main className="gameon-root">
      <AppMap
        events={mapEvents}
        selectedEvent={detailPresented ? detailEvent : undefined}
        locateToken={locateToken}
        onSelect={selectEvent}
      />
      <FloatingActions onLocate={handleLocate} />
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
          if (sheet === "create") { requireAuth(openCreate); return; }
          setActiveSheet(sheet);
        }}
      />

      {detailEvent ? (
        <EventDetailSheet
          event={detailEvent}
          profile={profile}
          user={user}
          isSignedIn={Boolean(user)}
          authBusy={authBusy}
          presented={detailPresented}
          onPresentedChange={setDetailPresented}
          onEdit={openEdit}
          onMutated={refreshSessionData}
        />
      ) : null}

      {showingSharedMissing ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-40 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-sm rounded-[28px] bg-[var(--card)] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <p className="detail-title text-center">Game not found</p>
            <p className="detail-caption mt-2 text-center">
              This shared game no longer exists or has already ended.
            </p>
            <button
              className="primary-action mt-5"
              onClick={handleViewOtherGames}
              type="button"
            >
              View other games
            </button>
          </div>
        </div>
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
        prefillFromEvent={lastHostedEvent}
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
            setActiveSheet(contactReturnSheet.current);
          }
        }}
        profile={profile}
        onSaved={refreshSessionData}
      />
    </main>
  );
}
