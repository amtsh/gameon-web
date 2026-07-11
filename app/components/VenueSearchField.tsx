"use client";

import { MapPin, Search } from "lucide-react";
import { useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { Venue } from "../types";

type Props = {
  value: Venue | null;
  onSelect: (venue: Venue | null) => void;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
  };
};

// Free OSM geocoder, CORS-enabled, no API key. Biased toward Stockholm
// like the iOS VenueSearchProvider is biased toward the map origin.
const PHOTON_URL = "https://photon.komoot.io/api/";

function toVenue(feature: PhotonFeature): Venue {
  const props = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = [props.street, props.housenumber].filter(Boolean).join(" ");
  return {
    name: props.name || street || "Venue",
    address: street || undefined,
    city: props.city,
    latitude,
    longitude,
  };
}

export function VenueSearchField({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<Venue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useDebouncedCallback(async (term: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        q: term,
        limit: "5",
        lat: "59.3236",
        lon: "18.0632",
      });
      const response = await fetch(`${PHOTON_URL}?${params}`, {
        signal: controller.signal,
      });
      const data: { features?: PhotonFeature[] } = await response.json();
      setResults((data.features ?? []).map(toVenue));
      setIsOpen(true);
    } catch {
      // Aborted or offline — keep previous results.
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  }, 350);

  return (
    <div
      className="venue-search"
      onBlur={(blurEvent) => {
        if (!blurEvent.currentTarget.contains(blurEvent.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="input-with-icon">
        <Search size={17} />
        <input
          placeholder="Venue"
          value={query}
          onChange={(changeEvent) => {
            const nextValue = changeEvent.target.value;
            setQuery(nextValue);
            onSelect(null);
            if (nextValue.trim().length < 3) {
              search.cancel();
              abortRef.current?.abort();
              setResults([]);
              setIsOpen(false);
              setIsSearching(false);
            } else {
              search(nextValue.trim());
            }
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
      </div>

      {isSearching ? <p className="hint">Searching venues...</p> : null}

      {isOpen && results.length > 0 ? (
        <ul className="venue-results">
          {results.map((venue, index) => (
            <li key={`${venue.name}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  setQuery(venue.name);
                  setIsOpen(false);
                  onSelect(venue);
                }}
              >
                <span className="venue-pin">
                  <MapPin size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="venue-name">{venue.name}</span>
                  <span className="venue-subtitle">
                    {[venue.address, venue.city].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {value ? (
        <p className="hint">
          Selected: {value.name}
          {value.city ? `, ${value.city}` : ""}
        </p>
      ) : null}
    </div>
  );
}
