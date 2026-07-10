"use client";

import { Icon } from "@iconify/react";
import clsx from "clsx";
import { sports } from "../data/mock-data";
import { isArchived } from "../event-feed";
import type { SportEvent } from "../types";

type Props = {
  events: SportEvent[];
  selectedEvent?: SportEvent;
  onSelect: (event: SportEvent) => void;
};

// Linear projection of the mock events' bounding box onto the visible
// map area (placeholder until real map tiles are wired up).
function markerPosition(events: SportEvent[], event: SportEvent) {
  const lats = events.map((candidate) => candidate.venue.latitude);
  const lngs = events.map((candidate) => candidate.venue.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const x =
    maxLng === minLng
      ? 0.5
      : (event.venue.longitude - minLng) / (maxLng - minLng);
  const y =
    maxLat === minLat
      ? 0.5
      : (maxLat - event.venue.latitude) / (maxLat - minLat);

  return {
    left: `${18 + x * 64}%`,
    top: `${16 + y * 42}%`,
  };
}

export function AppMap({ events, selectedEvent, onSelect }: Props) {
  const activeEvents = events.filter((event) => !isArchived(event));

  return (
    <div className="map-surface" aria-label="Map of nearby games">
      <div className="map-grid" />
      <div className="map-road map-road-a" />
      <div className="map-road map-road-b" />
      <div className="map-water" />
      <div className="map-label left-[18%] top-[24%]">Kungsholmen</div>
      <div className="map-label left-[56%] top-[28%]">Sodermalm</div>
      <div className="map-label left-[36%] top-[68%]">Arstaviken</div>

      {activeEvents.map((event) => {
        const sport = sports.find((candidate) => candidate.id === event.sport);
        const isSelected = selectedEvent?.id === event.id;

        return (
          <button
            aria-label={event.title}
            className={clsx("map-marker", isSelected && "map-marker-selected")}
            key={event.id}
            onClick={() => onSelect(event)}
            style={{
              ...markerPosition(activeEvents, event),
              ["--marker-accent" as string]: sport?.accent ?? "#ffffff",
            }}
          >
            <Icon icon={sport?.icon ?? "mdi:trophy"} width={isSelected ? 22 : 17} />
          </button>
        );
      })}
    </div>
  );
}
