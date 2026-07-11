"use client";

import { Sheet, Scroll } from "@silk-hq/components";
import { Plus, User } from "lucide-react";
import { useMemo, useState } from "react";
import { EventRow } from "./EventRow";
import { SportChips } from "./SportChips";
import {
  activeUserEvents,
  groupedDiscoverableEvents,
} from "../event-feed";
import type { SheetName, SportEvent, SportKind } from "../types";
import "./GamesSheet.css";

type Props = {
  events: SportEvent[];
  pastEvents: SportEvent[];
  isSignedIn: boolean;
  avatarUrl?: string;
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
  pastEvents,
  isSignedIn,
  avatarUrl,
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
  const pastGames = pastEvents;

  // Detent 0 is fully dismissed; 1 = half, 2 = full. Never allow resting
  // below half — this sheet is the app's persistent home surface.
  const [activeDetent, setActiveDetent] = useState(1);

  return (
    <Sheet.Root
      license="commercial"
      defaultPresented={true}
      activeDetent={activeDetent}
      onActiveDetentChange={(detent) =>
        setActiveDetent(Math.max(1, detent))
      }
    >
      <Sheet.Portal>
        <Sheet.View
          className="GamesSheet-view"
          // Half and full — full stops at the view top (below status bar).
          detents={["62svh", "100%"]}
          swipeOvershoot={false}
          swipeDismissal={false}
          // Non-modal, like iOS presentationBackgroundInteraction(.enabled):
          // the map and floating actions stay interactive.
          inertOutside={false}
          onClickOutside={{ dismiss: false, stopOverlayPropagation: true }}
          onEscapeKeyDown={{ dismiss: false, stopOverlayPropagation: true }}
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
                    className={
                      avatarUrl
                        ? "circle-button circle-button-avatar"
                        : "circle-button"
                    }
                    aria-label="Edit profile"
                    onClick={() => onOpenSheet("profile")}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="circle-button-photo"
                        referrerPolicy="no-referrer"
                        src={avatarUrl}
                      />
                    ) : (
                      <User size={20} fill="currentColor" strokeWidth={0} />
                    )}
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
                            <p className="empty-state">
                              {isSignedIn
                                ? "No past games yet"
                                : "Sign in to see games you joined or hosted"}
                            </p>
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

                          {sections.length === 0 && yourGames.length === 0 ? (
                            <p className="empty-state">No upcoming games nearby</p>
                          ) : null}

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
