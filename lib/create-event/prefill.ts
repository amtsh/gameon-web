import { addDays } from "date-fns";
import type { SportEvent } from "@/app/types";

export function toLocalDateTimeInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Advance weekly until the session start is in the future, keeping duration. */
export function nextSessionDatesFromPrevious(
  startsAt: string,
  endsAt: string,
  now = new Date(),
): { startsAt: string; endsAt: string } {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const durationMs = Math.max(end.getTime() - start.getTime(), 30 * 60_000);

  let nextStart = new Date(start);
  while (nextStart <= now) {
    nextStart = addDays(nextStart, 7);
  }

  const nextEnd = new Date(nextStart.getTime() + durationMs);
  return {
    startsAt: nextStart.toISOString(),
    endsAt: nextEnd.toISOString(),
  };
}

export function pickLatestHostedEvent(events: SportEvent[]): SportEvent | undefined {
  const hosted = events.filter((event) => event.isCreatedByCurrentUser);
  if (hosted.length === 0) return undefined;

  return hosted.reduce((latest, event) =>
    new Date(event.startsAt) > new Date(latest.startsAt) ? event : latest,
  );
}

export function buildCreatePrefill(source: SportEvent) {
  const dates = nextSessionDatesFromPrevious(source.startsAt, source.endsAt);

  return {
    sport: source.sport,
    skillLevel: source.skillLevel,
    venue: source.venue,
    autoApprove: source.autoApprove ?? false,
    isPrivate: source.isPrivate ?? false,
    title: source.title,
    startsAt: toLocalDateTimeInput(dates.startsAt),
    endsAt: toLocalDateTimeInput(dates.endsAt),
    capacity: source.capacity,
    cost: source.cost ?? "",
    description: source.description ?? "",
  };
}
