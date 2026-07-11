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
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | undefined>();
  const [activeSheet, setActiveSheet] = useState<SheetName>(null);
  const [showingPast, setShowingPast] = useState(false);
  const [locateToken, setLocateToken] = useState(0);

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

  return (
    <main className="gameon-root">
      <AppMap
        events={mockEvents}
        selectedEvent={selectedEvent}
        locateToken={locateToken}
        onSelect={setSelectedEvent}
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
        onSelectEvent={setSelectedEvent}
        onOpenSheet={setActiveSheet}
      />

      {selectedEvent ? (
        <EventDetailSheet
          event={selectedEvent}
          onClose={() => setSelectedEvent(undefined)}
        />
      ) : null}
      {activeSheet === "create" ? (
        <CreateEventSheet onClose={() => setActiveSheet(null)} />
      ) : null}
      {activeSheet === "profile" ? (
        <ProfileSheet
          onClose={() => setActiveSheet(null)}
          onContact={() => setActiveSheet("contact")}
        />
      ) : null}
      {activeSheet === "contact" ? (
        <ContactSheet onClose={() => setActiveSheet("profile")} />
      ) : null}
    </main>
  );
}
