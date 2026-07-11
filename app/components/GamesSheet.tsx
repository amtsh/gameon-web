"use client";

import { Sheet, Scroll } from "@silk-hq/components";
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
import "./GamesSheet.css";

type Props = {
  events: SportEvent[];
  selectedSports: SportKind[];
  showingPast: boolean;
  /** Detent index: 1 = 180px, 2 = 62svh, 3 = full. Controlled by the
      app so opening the detail sheet can snap to 62% like iOS. */
  detent: number;
  onDetentChange: (detent: number) => void;
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
  detent,
  onDetentChange,
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
    <Sheet.Root
      license="commercial"
      defaultPresented={true}
      activeDetent={detent}
      onActiveDetentChange={onDetentChange}
    >
      <Sheet.Portal>
        <Sheet.View
          className="GamesSheet-view"
          // Intermediate detents mirroring iOS
          // presentationDetents([.height(180), .fraction(0.62), .large]);
          // the last detent (full height) is implicit.
          detents={["180px", "62svh"]}
          swipeOvershoot={false}
          swipeDismissal={false}
          // Non-modal, like iOS presentationBackgroundInteraction(.enabled):
          // the map and floating actions stay interactive.
          inertOutside={false}
          nativeEdgeSwipePrevention={true}
        >
          <Sheet.Content className="GamesSheet-content">
            {/* Required for swipe to work in Safari when the sheet is
                non-modal and has no backdrop. */}
            <Sheet.SpecialWrapper.Root className="GamesSheet-specialWrapperRoot">
              <Sheet.SpecialWrapper.Content className="GamesSheet-specialWrapperContent">
                <Sheet.BleedingBackground className="GamesSheet-bleedingBackground" />

                {/* Grabber — action="step" cycles through detents */}
                <Sheet.Handle
                  className="GamesSheet-handle"
                  action="step"
                  aria-label="Resize sheet"
                />

                <header className="GamesSheet-header">
                  <div className="min-w-0 flex-1">
                    <Sheet.Title className="hero-title">
                      Nearby Games
                    </Sheet.Title>
                    <p className="hero-subtitle">
                      Discover and join local games
                    </p>
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

                {/* Silk Scroll handles the gesture boundary between
                    scrolling the list and dragging the sheet up/down */}
                <Scroll.Root className="GamesSheet-scrollRoot">
                  <Scroll.View
                    className="GamesSheet-scrollView no-scrollbar"
                    scrollGestureTrap={{ yEnd: true }}
                    onScrollStart={{ dismissKeyboard: true }}
                  >
                    <Scroll.Content className="GamesSheet-scrollContent">
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
                                <span className="primary">
                                  {section.title[0]}
                                </span>
                                <span className="slash">/</span>
                                <span className="secondary">
                                  {section.title[1]}
                                </span>
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
                            <button
                              className="show-all-button"
                              onClick={onShowAll}
                            >
                              Show All sports
                            </button>
                          ) : null}
                        </>
                      )}
                    </Scroll.Content>
                  </Scroll.View>
                </Scroll.Root>
              </Sheet.SpecialWrapper.Content>
            </Sheet.SpecialWrapper.Root>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
