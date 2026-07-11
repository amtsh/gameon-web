"use client";

import { Sheet, Scroll, type SheetViewProps } from "@silk-hq/components";
import { Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 820px)");
    setIsDesktop(mq.matches);
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

  const isDesktop = useIsDesktop();

  // On desktop: single detent (full), sheet is always open, can't collapse.
  // On mobile: half (62svh) + full (100%).
  const detents: string[] = isDesktop ? ["100%"] : ["62svh", "100%"];

  // Track whether the sheet has reached its topmost (full) detent.
  // When false the list must NOT scroll — every upward finger movement
  // should drag the sheet, not scroll the content.
  // On desktop we're always at full detent.
  const [atFullDetent, setAtFullDetent] = useState(isDesktop);
  const viewRef = useRef<HTMLElement>(null);

  // Keep atFullDetent in sync when switching between mobile/desktop.
  useEffect(() => {
    if (isDesktop) setAtFullDetent(true);
  }, [isDesktop]);

  // When the sheet starts travelling back down, dismiss the on-screen
  // keyboard (same technique used in SheetWithDetent example).
  const travelHandler = useMemo<SheetViewProps["onTravel"]>(() => {
    if (!atFullDetent) return undefined;
    return ({ progress }) => {
      if (viewRef.current && progress < 0.999) {
        viewRef.current.focus();
      }
    };
  }, [atFullDetent]);

  const setRefs = useCallback((node: HTMLElement | null) => {
    viewRef.current = node;
  }, []);

  return (
    <Sheet.Root
      license="commercial"
      defaultPresented={true}
      // On desktop always start at the only detent (index 1, i.e. 100%).
      // On mobile start at half (index 1 in 1-based Silk API = first detent).
      activeDetent={isDesktop ? 1 : activeDetent}
      onActiveDetentChange={isDesktop ? undefined : onActiveDetentChange}
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
          // Non-modal sheet: don't steal focus into it (e.g. onto the
          // profile button) just because it's presented on page load.
          onPresentAutoFocus={{ focus: false }}
          nativeEdgeSwipePrevention={true}
          onTravelStatusChange={(status) => {
            if (!isDesktop && status === "idleOutside") setAtFullDetent(false);
          }}
          onTravelRangeChange={(range) => {
            if (isDesktop || range.end === 2) setAtFullDetent(true);
          }}
          onTravel={travelHandler}
          ref={setRefs}
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
                      Within {DISCOVERY_RADIUS_KM} km radius around you
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
                            <p className="empty-state">
                              No games within {DISCOVERY_RADIUS_KM} km. Set your
                              postal code in profile, or open a shared game
                              link.
                            </p>
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
