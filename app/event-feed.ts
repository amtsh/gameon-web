import { startOfDay } from "date-fns";
import type { SportEvent, SportKind } from "./types";
import {
  clockTime,
  countdownUrgencyLevel,
  detailDate,
  eventTime,
  formatEventDuration,
  formatEventScheduleLabel,
  relativeCountdownLabel,
  sectionHeading,
  shortDateSuffix,
  weekdayLabel,
} from "@/lib/datetime/display";

export {
  clockTime,
  detailDate,
  eventTime,
  shortDateSuffix,
  weekdayLabel,
};

export const sectionTitle = sectionHeading;

/** Start and end schedule for list rows. */
export function eventRowScheduleLabel(
  event: SportEvent,
  options: { isArchived?: boolean } = {},
): string {
  return formatEventScheduleLabel(event.startsAt, event.endsAt, options);
}

// Mirrors EventRow.relativeLabel in RecommendedEventsSheet.swift
export function eventRelativeLabel(event: SportEvent, now = new Date()): string {
  return relativeCountdownLabel(
    new Date(event.startsAt),
    new Date(event.endsAt),
    now,
  );
}

export function countdownUrgency(
  event: SportEvent,
  now = new Date(),
): "urgent" | "hours" | null {
  return countdownUrgencyLevel(
    new Date(event.startsAt),
    new Date(event.endsAt),
    now,
  );
}

// Mirrors EventRow.durationText in RecommendedEventsSheet.swift
export function durationText(event: SportEvent): string {
  return formatEventDuration(
    new Date(event.startsAt),
    new Date(event.endsAt),
  );
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
    .filter(
      (event) =>
        isUserRelated(event) &&
        !event.isPrivate &&
        !isArchived(event, now),
    )
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
        (!isUserRelated(event) || Boolean(event.isPrivate)) &&
        !isArchived(event, now) &&
        !isCancelled(event),
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
      title: sectionHeading(new Date(day), now),
      events: dayEvents,
    }));
}
