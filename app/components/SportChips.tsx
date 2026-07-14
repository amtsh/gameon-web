"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { haptic } from "@/lib/haptics";
import { sports } from "../data/mock-data";
import type { SportKind } from "../types";

type Props = {
  selectedSports: SportKind[];
  showingPast: boolean;
  onToggleSport: (sport: SportKind) => void;
  onShowAll: () => void;
  onShowPast: () => void;
};

export function SportChips({
  selectedSports,
  showingPast,
  onToggleSport,
  onShowAll,
  onShowPast,
}: Props) {
  // iOS orders selected sports first (RecommendedEventsSheet.orderedSports).
  const orderedSports = [
    ...sports.filter((sport) => selectedSports.includes(sport.id)),
    ...sports.filter((sport) => !selectedSports.includes(sport.id)),
  ];

  return (
    <div className="no-scrollbar flex flex-none gap-2 overflow-x-auto pb-1">
      <button
        className={clsx(
          "chip",
          selectedSports.length === 0 && !showingPast && "chip-selected",
        )}
        onClick={() => {
          haptic("selection");
          onShowAll();
        }}
      >
        <Icon icon="mdi:view-grid" width={13} />
        All Sports
      </button>

      {orderedSports.map((sport) => (
        <button
          className={clsx(
            "chip",
            selectedSports.includes(sport.id) && "chip-selected",
          )}
          key={sport.id}
          onClick={() => {
            haptic("selection");
            onToggleSport(sport.id);
          }}
        >
          <Icon icon={sport.icon} width={13} />
          {sport.label}
        </button>
      ))}

      <button
        className={clsx("chip", showingPast && "chip-selected")}
        onClick={() => {
          haptic("selection");
          onShowPast();
        }}
      >
        <Icon icon="mdi:archive-outline" width={13} />
        Past Games
      </button>
    </div>
  );
}
