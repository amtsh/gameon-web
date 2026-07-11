"use client";

import { Plus, User } from "lucide-react";
import { useMemo } from "react";
import { EventRow } from "./EventRow";
import { SportChips } from "./SportChips";
import {
  activeUserEvents,
  archivedUserEvents,
  groupedDiscoverableEvents,
} from "../event-feed";
import type { SheetName, SportEvent, SportKind } from "../types";

type Props = {
  events: SportEvent[];
  selectedSports: SportKind[];
  showingPast: boolean;
  onToggleSport: (sport: SportKind) => void;
  onShowAll: () => void;
  onShowPast: () => void;
  onSelectEvent: (event: SportEvent) => void;
  onOpenSheet: (sheet: SheetName) => void;
};

export function GamesSheet({
  events,
  selectedSports,
  showingPast,
  onToggleSport,
  onShowAll,
  onShowPast,
  onSelectEvent,
  onOpenSheet,
}: Props) {
  const yourGames = useMemo(() => activeUserEvents(events), [events]);
  const sections = useMemo(
    () => groupedDiscoverableEvents(events, selectedSports),
    [events, selectedSports],
  );
  const pastGames = useMemo(() => archivedUserEvents(events), [events]);

  return (
    <section className="games-sheet" aria-label="Nearby Games">
      <div className="sheet-grabber" />
      <header className="mb-4 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="hero-title">Nearby Games</h1>
          <p className="hero-subtitle">Discover and join local games</p>
        </div>
        <button
          className="circle-button"
          aria-label="Edit profile"
          onClick={() => onOpenSheet("profile")}
        >
          <User size={20} fill="currentColor" strokeWidth={0} />
        </button>
        <button
          className="circle-button"
          aria-label="Create Game"
          onClick={() => onOpenSheet("create")}
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
      </header>

      <SportChips
        selectedSports={selectedSports}
        showingPast={showingPast}
        onToggleSport={onToggleSport}
        onShowAll={onShowAll}
        onShowPast={onShowPast}
      />

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
        {showingPast ? (
          <>
            <h2 className="section-title">Past Games</h2>
            {pastGames.length === 0 ? (
              <p className="empty-state">No past games yet</p>
            ) : (
              pastGames.map((event) => (
                <EventRow
                  event={event}
                  isArchived
                  key={event.id}
                  onSelect={() => onSelectEvent(event)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {yourGames.length > 0 ? (
              <h2 className="section-title">Your Games</h2>
            ) : null}
            {yourGames.map((event) => (
              <EventRow
                event={event}
                key={event.id}
                onSelect={() => onSelectEvent(event)}
              />
            ))}

            {sections.map((section) => (
              <div key={section.key}>
                <h2 className="section-eyebrow">
                  <span className="primary">{section.title[0]}</span>
                  <span className="slash">/</span>
                  <span className="secondary">{section.title[1]}</span>
                </h2>
                {section.events.map((event) => (
                  <EventRow
                    event={event}
                    key={event.id}
                    onSelect={() => onSelectEvent(event)}
                  />
                ))}
              </div>
            ))}

            {selectedSports.length > 0 ? (
              <button className="show-all-button" onClick={onShowAll}>
                Show All sports
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
