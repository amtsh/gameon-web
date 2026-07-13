import { sports } from "@/app/data/mock-data";
import type { SportEvent } from "@/app/types";
import { timeZoneForVenue } from "@/lib/date/event-timezone";
import {
  calendarDayKey,
  formatDateLabel,
  formatTimeLabel,
  formatWeekdayLabel,
} from "@/lib/date/format-in-timezone";
import { siteName } from "@/lib/seo/metadata";

function getSportLabel(event: SportEvent, sportLabel?: string): string {
  if (sportLabel) return sportLabel;
  return (
    sports.find((candidate) => candidate.id === event.sport)?.label ??
    event.sport.charAt(0).toUpperCase() + event.sport.slice(1)
  );
}

function eventScheduleContext(event: SportEvent) {
  const timeZone = timeZoneForVenue(event.venue, event.startsAt);
  return {
    timeZone,
    start: new Date(event.startsAt),
    end: new Date(event.endsAt),
  };
}

export function formatSharedGameOgTitle(
  event: SportEvent,
  sportLabel?: string,
): string {
  return `${getSportLabel(event, sportLabel)}: ${event.title}`;
}

/** Page and link-preview title for shared game URLs. */
export function formatSharedGameLinkTitle(
  event: SportEvent,
  sportLabel?: string,
): string {
  return `Join ${getSportLabel(event, sportLabel)} - ${event.title}`;
}

export function formatSharedGameOgDate(event: SportEvent): string {
  const { timeZone, start, end } = eventScheduleContext(event);

  if (calendarDayKey(start, timeZone) === calendarDayKey(end, timeZone)) {
    return `${formatDateLabel(start, timeZone)} · ${formatTimeLabel(start, timeZone)} – ${formatTimeLabel(end, timeZone)}`;
  }

  return `${formatDateLabel(start, timeZone)} · ${formatTimeLabel(start, timeZone)} – ${formatDateLabel(end, timeZone)} · ${formatTimeLabel(end, timeZone)}`;
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
  const sport = getSportLabel(event, sportLabel).toLowerCase();
  const { timeZone, start } = eventScheduleContext(event);
  const day = formatWeekdayLabel(start, timeZone);
  const spotsLeft = Math.max(event.capacity - event.joinedCount, 0);

  if (spotsLeft > 0 && spotsLeft <= 3) {
    return `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left — join on ${siteName}`;
  }

  return `Hey — grab your spot for ${day} ${sport}`;
}

/** Strip combining marks so Satori can render venue/address text reliably. */
export function sanitizeOgText(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}
