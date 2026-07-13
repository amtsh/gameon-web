import { format, isSameDay } from "date-fns";
import { sports } from "@/app/data/mock-data";
import type { SportEvent } from "@/app/types";
import { siteName } from "@/lib/seo/metadata";

function getSportLabel(event: SportEvent, sportLabel?: string): string {
  if (sportLabel) return sportLabel;
  return (
    sports.find((candidate) => candidate.id === event.sport)?.label ??
    event.sport.charAt(0).toUpperCase() + event.sport.slice(1)
  );
}

export function formatSharedGameOgTitle(
  event: SportEvent,
  sportLabel?: string,
): string {
  return `${getSportLabel(event, sportLabel)}: ${event.title}`;
}

export function formatSharedGameOgDate(event: SportEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);

  if (isSameDay(start, end)) {
    return `${format(start, "EEE, d MMM")} · ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
  }

  return `${format(start, "EEE, d MMM · HH:mm")} – ${format(end, "EEE, d MMM · HH:mm")}`;
}

export function formatSharedGameOgVenue(event: SportEvent): {
  name: string;
  subtitle?: string;
} {
  const name = event.venue.name || event.venue.address || "Venue";
  const subtitle = [event.venue.address, event.venue.city]
    .filter(Boolean)
    .join(", ");

  return subtitle && subtitle !== name ? { name, subtitle } : { name };
}

export function formatSharedGameDescription(event: SportEvent): string {
  const venue = formatSharedGameOgVenue(event);
  return `${formatSharedGameOgDate(event)} at ${venue.name}`;
}

/** Short share body — link preview already shows date, venue, and title. */
export function formatSharedGameShareText(
  event: SportEvent,
  sportLabel?: string,
): string {
  const sport = (sportLabel ?? event.sport).toLowerCase();
  const spotsLeft = Math.max(event.capacity - event.joinedCount, 0);

  if (spotsLeft > 0 && spotsLeft <= 3) {
    return `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left — join on ${siteName}`;
  }

  return `Join this ${sport} game on ${siteName}`;
}

/** Strip combining marks so Satori can render venue/address text reliably. */
export function sanitizeOgText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}
