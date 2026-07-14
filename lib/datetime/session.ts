import {
  addDays,
  addHours,
  addMonths,
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  isAfter,
  isSameDay,
  isToday,
  isTomorrow,
  parse,
  parseISO,
  startOfHour,
} from "date-fns";

export type SessionFields = {
  sessionDate: string;
  startTime: string;
  endTime: string;
  endDate: string;
};

const SESSION_PARSE_FMT = "yyyy-MM-dd HH:mm";
const DATE_FMT = "yyyy-MM-dd";
const TIME_FMT = "HH:mm";
const DATETIME_LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

function parseTimestamp(value: string): Date {
  if (value.includes("T")) {
    const parsed = parseISO(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date(value);
}

function parseSession(date: string, time: string): Date | null {
  if (!date || !time) return null;

  const parsed = parse(`${date} ${time}`, SESSION_PARSE_FMT, new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toLocalDateTimeInput(iso: string): string {
  return format(parseTimestamp(iso), DATETIME_LOCAL_FMT);
}

export function toDateInput(date: Date): string {
  return format(date, DATE_FMT);
}

export function toTimeInput(date: Date): string {
  return format(date, TIME_FMT);
}

export function sessionFieldsFromDatetimes(
  startsAt: string,
  endsAt: string,
): SessionFields {
  const start = parseTimestamp(startsAt);
  const end = parseTimestamp(endsAt);

  return {
    sessionDate: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    endDate: toDateInput(end),
  };
}

export function defaultSessionFields(now = new Date()): SessionFields {
  const start = startOfHour(addHours(now, 2));
  const end = addHours(start, 1);

  return {
    sessionDate: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    endDate: toDateInput(end),
  };
}

export function endTimeOneHourAfter(startTime: string): string | null {
  const start = parseSession(format(new Date(), DATE_FMT), startTime);
  if (!start) return null;

  return toTimeInput(addHours(start, 1));
}

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

  return format(addDays(end, deltaDays), DATE_FMT);
}

export function composeSessionDatetimes({
  sessionDate,
  startTime,
  endDate,
  endTime,
}: SessionFields): { startsAt: string; endsAt: string } {
  const start = parseSession(sessionDate, startTime);
  const end = parseSession(endDate, endTime);

  return {
    startsAt: start
      ? format(start, DATETIME_LOCAL_FMT)
      : `${sessionDate}T${startTime}`,
    endsAt: end ? format(end, DATETIME_LOCAL_FMT) : `${endDate}T${endTime}`,
  };
}

export function isSessionScheduleValid(fields: SessionFields): boolean {
  const start = parseSession(fields.sessionDate, fields.startTime);
  const end = parseSession(fields.endDate, fields.endTime);
  if (!start || !end) return false;

  return isAfter(end, start);
}

export function isSessionDateWithinLimit(
  sessionDate: string,
  now = new Date(),
): boolean {
  const date = parseISO(sessionDate);
  if (Number.isNaN(date.getTime())) return false;

  return !isAfter(date, addMonths(now, 3));
}

export function formatSessionDateLabel(dateStr: string, now = new Date()): string {
  const date = parseISO(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  return format(date, "EEE, d MMM");
}

function sessionDurationLabel(start: Date, end: Date): string | null {
  if (!isAfter(end, start)) return null;

  const minutes = differenceInMinutes(end, start);
  if (minutes < 60) return `${minutes} min`;

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${(minutes / 60).toFixed(1).replace(/\.0$/, "")} hours`;
}

export function formatSchedulePreview(
  sessionDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  now = new Date(),
): string | null {
  const start = parseSession(sessionDate, startTime);
  const end = parseSession(endDate, endTime);
  if (!start || !end || !isAfter(end, start)) return null;

  const dateLabel = formatSessionDateLabel(sessionDate, now);
  const timeRange = isSameDay(start, end)
    ? `${startTime} – ${endTime}`
    : `${format(start, "EEE, d MMM")} ${startTime} – ${format(end, "EEE, d MMM")} ${endTime}`;
  const duration = sessionDurationLabel(start, end);

  return duration
    ? `${dateLabel} · ${timeRange} · ${duration}`
    : `${dateLabel} · ${timeRange}`;
}
