import {
  addDays,
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from "date-fns";

// Mirrors GameOnDateFormatters.swift
export const eventTime = (date: Date) => format(date, "EEE, d MMM · HH:mm");
export const clockTime = (date: Date) => format(date, "HH:mm");
export const detailDate = (date: Date) => format(date, "EEE, d MMM");
export const weekdayLabel = (date: Date) => format(date, "EEE");
export const shortDateSuffix = (date: Date) => format(date, ", d MMM");

export function shortRelativeDayLabel(
  date: Date | string,
  now = new Date(),
): string {
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";

  if (isToday(parsed)) return "Today";
  if (isTomorrow(parsed)) return "Tomorrow";

  return format(parsed, "EEE, d MMM");
}

export function sectionHeading(date: Date, now = new Date()): [string, string] {
  if (isSameDay(date, now)) return ["Today", format(date, "EEEE")];
  if (isSameDay(date, addDays(startOfDay(now), 1))) {
    return ["Tomorrow", format(date, "EEEE")];
  }
  return [format(date, "d MMMM"), format(date, "EEEE")];
}

export type EventScheduleKind =
  | { type: "archived"; end: Date }
  | { type: "same-day"; start: Date; end: Date }
  | { type: "multi-day"; start: Date; end: Date };

export function eventScheduleKind(
  startsAt: string | Date,
  endsAt: string | Date,
  options: { isArchived?: boolean } = {},
): EventScheduleKind {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;

  if (options.isArchived) return { type: "archived", end };
  if (isSameDay(start, end)) return { type: "same-day", start, end };
  return { type: "multi-day", start, end };
}

export function formatEventScheduleLabel(
  startsAt: string | Date,
  endsAt: string | Date,
  options: { isArchived?: boolean } = {},
): string {
  const kind = eventScheduleKind(startsAt, endsAt, options);

  switch (kind.type) {
    case "archived":
      return `Ended ${eventTime(kind.end)}`;
    case "same-day":
      return `${detailDate(kind.start)} · ${clockTime(kind.start)} – ${clockTime(kind.end)}`;
    case "multi-day":
      return `${eventTime(kind.start)} – ${eventTime(kind.end)}`;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

// Mirrors EventRow.relativeLabel in RecommendedEventsSheet.swift
export function relativeCountdownLabel(
  startsAt: Date,
  endsAt: Date,
  now = new Date(),
): string {
  if (!isAfter(endsAt, now)) return "Ended";
  if (!isAfter(startsAt, now)) return "Now";

  const totalDays = differenceInCalendarDays(startsAt, now);
  if (totalDays >= 1) {
    return totalDays === 1 ? "In 1 day" : `In ${totalDays} days`;
  }

  const totalHours = differenceInHours(startsAt, now);
  if (totalHours >= 1) {
    return totalHours === 1 ? "In 1 hour" : `In ${totalHours} hours`;
  }

  const totalMinutes = Math.ceil(differenceInSeconds(startsAt, now) / 60);
  if (totalMinutes >= 1) {
    return totalMinutes === 1 ? "In 1 minute" : `In ${totalMinutes} minutes`;
  }

  return "Now";
}

/**
 * Returns the urgency level of the countdown for styling purposes:
 * - "urgent"  → under 3 hours  → red
 * - "hours"   → 3 h or more, but less than 1 day  → yellow
 * - null      → 1 day or more away (or already started/ended) → no colour
 */
export function countdownUrgencyLevel(
  startsAt: Date,
  endsAt: Date,
  now = new Date(),
): "urgent" | "hours" | null {
  if (!isAfter(endsAt, now) || !isAfter(startsAt, now)) return null;

  const minutesUntilStart = differenceInMinutes(startsAt, now);
  const hoursUntilStart = minutesUntilStart / 60;

  if (hoursUntilStart >= 24) return null;
  if (hoursUntilStart < 3) return "urgent";
  return "hours";
}

// Mirrors EventRow.durationText in RecommendedEventsSheet.swift
export function formatEventDuration(start: Date, end: Date): string {
  const totalMinutes = Math.max(1, Math.round(differenceInMinutes(end, start)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${Math.max(hours, 1)}h`;
  if (hours > 0 && minutes === 30) return `${hours}.5h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatSessionDurationLabel(start: Date, end: Date): string | null {
  if (!isAfter(end, start)) return null;

  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min`;

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${(minutes / 60).toFixed(1).replace(/\.0$/, "")} hours`;
}
