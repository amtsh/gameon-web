import { format, isSameDay, addDays, startOfDay } from "date-fns";
import type { SportEvent, SportKind } from "./types";

// Mirrors GameOnDateFormatters.swift
export const eventTime = (date: Date) => format(date, "EEE, d MMM · HH:mm");
export const clockTime = (date: Date) => format(date, "HH:mm");
export const detailDate = (date: Date) => format(date, "EEE, d MMM");

export function sectionTitle(date: Date, now = new Date()): [string, string] {
  if (isSameDay(date, now)) return ["Today", format(date, "EEEE")];
  if (isSameDay(date, addDays(startOfDay(now), 1))) {
    return ["Tomorrow", format(date, "EEEE")];
  }
  return [format(date, "d MMMM"), format(date, "EEEE")];
}

// Mirrors EventRow.relativeLabel in RecommendedEventsSheet.swift
export function eventRelativeLabel(event: SportEvent, now = new Date()): string {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);

  if (endsAt <= now) return "Ended";
  if (startsAt <= now) return "Now";

  const totalMinutes = Math.ceil(
    (startsAt.getTime() - now.getTime()) / 60_000,
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    return totalDays === 1 ? "In 1 day" : `In ${totalDays} days`;
  }
  if (totalHours >= 1) {
    return totalHours === 1 ? "In 1 hour" : `In ${totalHours} hours`;
  }
  if (totalMinutes >= 1) {
    return totalMinutes === 1 ? "In 1 minute" : `In ${totalMinutes} minutes`;
  }

  return "Now";
}

// Mirrors EventRow.durationText in RecommendedEventsSheet.swift
export function durationText(event: SportEvent): string {
  const totalMinutes = Math.max(
    1,
    Math.round(
      (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) /
        60_000,
    ),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${Math.max(hours, 1)}h`;
  if (hours > 0 && minutes === 30) return `${hours}.5h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Mirrors SportEvent.swift helpers
export const spotsLeft = (event: SportEvent) =>
  Math.max(event.capacity - event.joinedCount, 0);

export const isArchived = (event: SportEvent, now = new Date()) =>
  new Date(event.endsAt) <= now;

export const isCancelled = (event: SportEvent) => Boolean(event.isCancelled);

export const isUserRelated = (event: SportEvent) =>
  Boolean(
    event.isCreatedByCurrentUser ||
      event.isJoined ||
      event.hasPendingRequest ||
      event.isOnWaitlist,
  );

const byStart = (a: SportEvent, b: SportEvent) => {
  const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  return diff !== 0 ? diff : a.title.localeCompare(b.title);
};

// Mirrors EventFeed.swift
export function activeUserEvents(events: SportEvent[], now = new Date()) {
  return events
    .filter((event) => isUserRelated(event) && !isArchived(event, now))
    .sort(byStart);
}

export function archivedUserEvents(events: SportEvent[], now = new Date()) {
  return events
    .filter((event) => isUserRelated(event) && isArchived(event, now))
    .sort((a, b) => {
      const diff =
        new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime();
      return diff !== 0 ? diff : a.title.localeCompare(b.title);
    });
}

export type EventSection = {
  key: string;
  title: [string, string];
  events: SportEvent[];
};

// Mirrors EventListSection.swift: discoverable events grouped by day.
export function groupedDiscoverableEvents(
  events: SportEvent[],
  selectedSports: SportKind[],
  now = new Date(),
): EventSection[] {
  const visible = events
    .filter(
      (event) =>
        !isUserRelated(event) && !isArchived(event, now) && !isCancelled(event),
    )
    .filter(
      (event) =>
        selectedSports.length === 0 || selectedSports.includes(event.sport),
    )
    .sort(byStart);

  const sections = new Map<number, SportEvent[]>();
  for (const event of visible) {
    const day = startOfDay(new Date(event.startsAt)).getTime();
    sections.set(day, [...(sections.get(day) ?? []), event]);
  }

  return [...sections.entries()]
    .sort(([a], [b]) => a - b)
    .map(([day, dayEvents]) => ({
      key: String(day),
      title: sectionTitle(new Date(day), now),
      events: dayEvents,
    }));
}
