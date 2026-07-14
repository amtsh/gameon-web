"use client";

import { Sheet, Scroll, type SheetViewProps } from "@silk-hq/components";
import { MessagesSquare, Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EventRow } from "./EventRow";
import { SportChips } from "./SportChips";
import { activeUserEvents, groupedDiscoverableEvents } from "../event-feed";
import { DISCOVERY_RADIUS_KM } from "@/lib/location/constants";
import type { SheetName, SportEvent, SportKind } from "../types";
import "./GamesSheet.css";

type Props = {
  events: SportEvent[];
  pastEvents: SportEvent[];
  isSignedIn: boolean;
  avatarUrl?: string;
  discoveryLocationLabel: string;
  selectedSports: SportKind[];
  showingPast: boolean;
  activeDetent: number;
  onActiveDetentChange: (detent: number) => void;
  onToggleSport: (sport: SportKind) => void;
  onShowAll: () => void;
  onShowPast: () => void;
  onSelectEvent: (event: SportEvent) => void;
  onOpenSheet: (sheet: SheetName) => void;
};

/** Returns true once the viewport is ≥820 px wide (matches GamesSheet.css breakpoint). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 820px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 820px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function GamesSheet({
  events,
  pastEvents,
  isSignedIn,
  avatarUrl,
  discoveryLocationLabel,
  selectedSports,
  showingPast,
  activeDetent,
  onActiveDetentChange,
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
  const showNearbyEmpty = sections.length === 0 && yourGames.length === 0;

  const isDesktop = useIsDesktop();

  // On desktop: single detent (full), sheet is always open, can't collapse.
  // On mobile: half (62svh) + full (100%).
  const detents: string[] = isDesktop ? ["100%"] : ["62svh", "100%"];

  // fullDetentIndex is the 1-based index of the topmost detent.
  // Desktop has only one detent (index 1); mobile has two (index 2 = full).
  const fullDetentIndex = isDesktop ? 1 : 2;

  // atFullDetent controls whether the scroll list is interactive.
  // We derive it directly from activeDetent so it is always in sync —
  // no separate travel-status tracking needed.
  // On desktop we're always at full detent.
  const atFullDetent = isDesktop || activeDetent === fullDetentIndex;

  // Single handler: keeps parent gamesDetent in sync and is the sole
  // source of truth for atFullDetent (via the activeDetent prop above).
  const handleDetentChange = useCallback(
    (detent: number) => {
      // Prevent accidental collapse below the first detent on mobile.
      onActiveDetentChange(Math.max(1, detent));
    },
    [onActiveDetentChange],
  );

  return (
    <Sheet.Root
      license="commercial"
      defaultPresented={true}
      activeDetent={isDesktop ? 1 : activeDetent}
      onActiveDetentChange={isDesktop ? undefined : handleDetentChange}
    >
      <Sheet.Portal>
        <Sheet.View
          className="GamesSheet-view"
          detents={detents}
          swipeOvershoot={false}
          swipeDismissal={false}
          // Non-modal: map and floating actions stay interactive.
          inertOutside={false}
          onClickOutside={{ dismiss: false, stopOverlayPropagation: true }}
          onEscapeKeyDown={{ dismiss: false, stopOverlayPropagation: true }}
          // Non-modal sheet: don't steal focus into it on page load.
          onPresentAutoFocus={{ focus: false }}
          nativeEdgeSwipePrevention={true}
        >
          <Sheet.Content className="GamesSheet-content">
            <Sheet.SpecialWrapper.Root className="GamesSheet-specialWrapperRoot">
              <Sheet.SpecialWrapper.Content className="GamesSheet-specialWrapperContent">
                <Sheet.BleedingBackground className="GamesSheet-bleedingBackground" />

                {/* Handle: always rendered for visual consistency.
                    On desktop it's purely decorative (no Sheet.Handle action);
                    on mobile it steps/dismisses the sheet as before. */}
                {isDesktop ? (
                  <div className="GamesSheet-handle" aria-hidden="true" />
                ) : (
                  <Sheet.Handle
                    className="GamesSheet-handle"
                    action={atFullDetent ? "dismiss" : "step"}
                    aria-label="Resize sheet"
                  />
                )}

                <header className="GamesSheet-header">
                  <div className="min-w-0 flex-1">
                    <Sheet.Title className="hero-title">
                      Nearby Games
                    </Sheet.Title>
                    <p className="hero-subtitle">
                      {discoveryLocationLabel}
                      <span style={{ color: "var(--label-text)" }}> · </span>
                      Within {DISCOVERY_RADIUS_KM} km radius
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

                <Scroll.Root className="GamesSheet-scrollRoot">
                  <Scroll.View
                    className="GamesSheet-scrollView sheet-scroll-view"
                    scrollGestureTrap={{ yEnd: true }}
                    scrollGesture={atFullDetent ? "auto" : false}
                    safeArea="layout-viewport"
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
                      ) : showNearbyEmpty ? (
                        <div className="empty-state-block">
                          <p className="empty-state-title">
                            No games within {DISCOVERY_RADIUS_KM} km of{" "}
                            {discoveryLocationLabel}
                          </p>
                          <p className="empty-state">
                            Nothing posted nearby yet.
                          </p>
                          <div className="empty-state-actions">
                            <button
                              className="primary-action"
                              onClick={() => onOpenSheet("create")}
                              type="button"
                            >
                              Host a game
                            </button>
                          </div>
                        </div>
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

                {!showingPast && (
                  <div className="GamesSheet-feedback">
                    <a
                      className="GamesSheet-feedback-link row-meta"
                      href="https://gameon.userjot.com"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <MessagesSquare aria-hidden size={12} strokeWidth={2} />
                      <span className="row-meta-text">Give feedback</span>
                    </a>
                  </div>
                )}
              </Sheet.SpecialWrapper.Content>
            </Sheet.SpecialWrapper.Root>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
