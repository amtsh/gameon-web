import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { toLocalDateTimeInput } from "./prefill";

export function splitLocalDateTimeInput(value: string): {
  date: string;
  time: string;
} {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export function combineLocalDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

export function sessionFieldsFromDatetimes(
  startsAt: string,
  endsAt: string,
): {
  sessionDate: string;
  startTime: string;
  endTime: string;
  endDate: string;
} {
  const start = splitLocalDateTimeInput(toLocalDateTimeInput(startsAt));
  const end = splitLocalDateTimeInput(toLocalDateTimeInput(endsAt));

  return {
    sessionDate: start.date,
    startTime: start.time,
    endTime: end.time,
    endDate: end.date,
  };
}

export function defaultSessionFields(now = new Date()) {
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);
  const end = new Date(start.getTime() + 60 * 60_000);

  const startFields = splitLocalDateTimeInput(toLocalDateTimeInput(start.toISOString()));
  const endFields = splitLocalDateTimeInput(toLocalDateTimeInput(end.toISOString()));

  return {
    sessionDate: startFields.date,
    startTime: startFields.time,
    endTime: endFields.time,
    endDate: endFields.date,
  };
}

export function endTimeOneHourAfter(startTime: string): string | null {
  const [hours = "0", minutes = "0"] = startTime.split(":");
  const hour = Number(hours);
  const minute = Number(minutes);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const totalMinutes = hour * 60 + minute + 60;
  const nextHour = Math.floor(totalMinutes / 60) % 24;
  const nextMinute = totalMinutes % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}

/**
 * Shifts endDate by the same number of days sessionDate just moved, so an
 * existing span (same-day or multi-day) is preserved rather than silently
 * dropped when the user edits the start date.
 */
export function shiftEndDate(
  previousSessionDate: string,
  nextSessionDate: string,
  endDate: string,
): string {
  const previous = parseISO(previousSessionDate);
  const next = parseISO(nextSessionDate);
  const end = parseISO(endDate);
  if (
    Number.isNaN(previous.getTime()) ||
    Number.isNaN(next.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return endDate;
  }

  const deltaDays = differenceInCalendarDays(next, previous);
  if (deltaDays === 0) return endDate;
  return format(addDays(end, deltaDays), "yyyy-MM-dd");
}

export function composeSessionDatetimes({
  sessionDate,
  startTime,
  endDate,
  endTime,
}: {
  sessionDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}): { startsAt: string; endsAt: string } {
  return {
    startsAt: combineLocalDateTime(sessionDate, startTime),
    endsAt: combineLocalDateTime(endDate, endTime),
  };
}

export function isSessionScheduleValid({
  sessionDate,
  startTime,
  endDate,
  endTime,
}: {
  sessionDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}): boolean {
  const { startsAt, endsAt } = composeSessionDatetimes({
    sessionDate,
    startTime,
    endDate,
    endTime,
  });
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end > start;
}

export function isSessionDateWithinLimit(sessionDate: string, now = new Date()): boolean {
  const date = parseISO(sessionDate);
  if (Number.isNaN(date.getTime())) return false;
  const max = new Date(now);
  max.setMonth(max.getMonth() + 3);
  return date <= max;
}
