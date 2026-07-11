"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  Map,
  Marker,
  type MapRef,
} from "@vis.gl/react-maplibre";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { useEffect, useMemo, useRef } from "react";
import { sports } from "../data/mock-data";
import { isArchived } from "../event-feed";
import type { SportEvent } from "../types";

// Free vector style, no API key required.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const STOCKHOLM = { longitude: 18.0632, latitude: 59.3236 };

type Props = {
  events: SportEvent[];
  selectedEvent?: SportEvent;
  /** Incremented by the parent to request a fly-to-user-location. */
  locateToken: number;
  onSelect: (event: SportEvent) => void;
};

export function AppMap({ events, selectedEvent, locateToken, onSelect }: Props) {
  const mapRef = useRef<MapRef>(null);

  const activeEvents = useMemo(
    () => events.filter((event) => !isArchived(event)),
    [events],
  );

  // Mirrors iOS focusMap(on:) — camera follows the selected event.
  useEffect(() => {
    if (!selectedEvent) return;
    mapRef.current?.flyTo({
      center: [selectedEvent.venue.longitude, selectedEvent.venue.latitude],
      zoom: 13.5,
      duration: 800,
    });
  }, [selectedEvent]);

  // Mirrors iOS focusOnCurrentLocation().
  useEffect(() => {
    if (locateToken === 0) return;
    const flyTo = (longitude: number, latitude: number) =>
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 13, duration: 800 });

    if (!navigator.geolocation) {
      flyTo(STOCKHOLM.longitude, STOCKHOLM.latitude);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => flyTo(position.coords.longitude, position.coords.latitude),
      () => flyTo(STOCKHOLM.longitude, STOCKHOLM.latitude),
      { timeout: 5_000 },
    );
  }, [locateToken]);

  return (
    <div className="map-container" aria-label="Map of nearby games">
      <Map
        ref={mapRef}
        initialViewState={{ ...STOCKHOLM, zoom: 11.6 }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
      >
        <AttributionControl compact position="top-right" />
        {activeEvents.map((event) => {
          const sport = sports.find((candidate) => candidate.id === event.sport);
          const isSelected = selectedEvent?.id === event.id;

          return (
            <Marker
              anchor="center"
              key={event.id}
              latitude={event.venue.latitude}
              longitude={event.venue.longitude}
              style={{ zIndex: isSelected ? 2 : 1 }}
            >
              <button
                aria-label={event.title}
                className={clsx("map-marker", isSelected && "map-marker-selected")}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onSelect(event);
                }}
                style={{ ["--marker-accent" as string]: sport?.accent ?? "#ffffff" }}
              >
                <Icon
                  icon={sport?.icon ?? "mdi:trophy"}
                  width={isSelected ? 22 : 17}
                />
              </button>
            </Marker>
          );
        })}
      </Map>
      {/* iOS map gradient overlay (ContentView.mapOverlayColors) */}
      <div className="map-overlay" />
    </div>
  );
}
