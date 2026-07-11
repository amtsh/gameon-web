"use client";

import { Plus, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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

// Mirrors iOS presentationDetents([.height(180), .fraction(0.62), .large]).
type Detent = "collapsed" | "half" | "full";

function detentHeight(detent: Detent, viewportHeight: number) {
  switch (detent) {
    case "collapsed":
      return 180;
    case "half":
      return viewportHeight * 0.62;
    case "full":
      return viewportHeight * 0.94;
  }
}

function nearestDetent(height: number, viewportHeight: number): Detent {
  const detents: Detent[] = ["collapsed", "half", "full"];
  return detents.reduce((best, candidate) =>
    Math.abs(detentHeight(candidate, viewportHeight) - height) <
    Math.abs(detentHeight(best, viewportHeight) - height)
      ? candidate
      : best,
  );
}

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
  const [detent, setDetent] = useState<Detent>("half");
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  const onHandlePointerDown = (downEvent: React.PointerEvent) => {
    const sheet = downEvent.currentTarget.closest(".games-sheet");
    if (!sheet) return;
    downEvent.currentTarget.setPointerCapture(downEvent.pointerId);
    dragStart.current = {
      y: downEvent.clientY,
      height: sheet.getBoundingClientRect().height,
    };
  };

  const onHandlePointerMove = (moveEvent: React.PointerEvent) => {
    if (!dragStart.current) return;
    const next = dragStart.current.height + (dragStart.current.y - moveEvent.clientY);
    setDragHeight(
      Math.min(Math.max(next, 120), window.innerHeight * 0.94),
    );
  };

  const onHandlePointerEnd = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    if (dragHeight !== null) {
      setDetent(nearestDetent(dragHeight, window.innerHeight));
    }
    setDragHeight(null);
  };

  const sheetStyle: React.CSSProperties = {
    height:
      dragHeight !== null
        ? dragHeight
        : detent === "collapsed"
          ? 180
          : detent === "half"
            ? "62svh"
            : "94svh",
    transition: dragHeight !== null ? "none" : "height 280ms cubic-bezier(0.32, 0.72, 0, 1)",
  };

  const yourGames = useMemo(() => activeUserEvents(events), [events]);
  const sections = useMemo(
    () => groupedDiscoverableEvents(events, selectedSports),
    [events, selectedSports],
  );
  const pastGames = useMemo(() => archivedUserEvents(events), [events]);

  return (
    <section className="games-sheet" aria-label="Nearby Games" style={sheetStyle}>
      <div
        className="sheet-drag-zone"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerEnd}
        onPointerCancel={onHandlePointerEnd}
      >
        <div className="sheet-grabber" />
      </div>
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
