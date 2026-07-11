"use client";

import { useCallback, useState } from "react";
import { AppMap } from "./components/AppMap";
import { ContactSheet } from "./components/ContactSheet";
import { CreateEventSheet } from "./components/CreateEventSheet";
import { EventDetailSheet } from "./components/EventDetailSheet";
import { FloatingActions } from "./components/FloatingActions";
import { GamesSheet } from "./components/GamesSheet";
import { ProfileSheet } from "./components/ProfileSheet";
import { mockEvents } from "./data/mock-data";
import type { SheetName, SportEvent, SportKind } from "./types";

export default function GameOnApp() {
  const [selectedSports, setSelectedSports] = useState<SportKind[]>([]);
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [showingPast, setShowingPast] = useState(false);
  const [locateToken, setLocateToken] = useState(0);
  // The detail sheet stays mounted once an event has been viewed; only
  // `detailPresented` toggles. Remounting Silk sheets breaks their
  // dismissal/re-presentation lifecycle.
  const [detailEvent, setDetailEvent] = useState<SportEvent | undefined>();
  const [detailPresented, setDetailPresented] = useState(false);

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
        events={mockEvents}
        selectedEvent={detailPresented ? detailEvent : undefined}
        locateToken={locateToken}
        onSelect={selectEvent}
      />
      <FloatingActions
        onCreate={() => setActiveSheet("create")}
        onLocate={() => setLocateToken((token) => token + 1)}
      />
      <GamesSheet
        events={mockEvents}
        selectedSports={selectedSports}
        showingPast={showingPast}
        onToggleSport={toggleSport}
        onShowAll={showAll}
        onShowPast={showPast}
        onSelectEvent={selectEvent}
        onOpenSheet={setActiveSheet}
      />

      {detailEvent ? (
        <EventDetailSheet
          event={detailEvent}
          presented={detailPresented}
          onPresentedChange={setDetailPresented}
        />
      ) : null}
      <CreateEventSheet
        presented={activeSheet === "create"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "create" : null)
        }
      />
      <ProfileSheet
        presented={activeSheet === "profile"}
        onPresentedChange={(presented) =>
          setActiveSheet(presented ? "profile" : null)
        }
        onContact={() => setActiveSheet("contact")}
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
