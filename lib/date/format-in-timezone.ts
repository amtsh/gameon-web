type DateTimeFormatCache = Map<string, Intl.DateTimeFormat>;

const dateLabelFormatters: DateTimeFormatCache = new Map();
const timeLabelFormatters: DateTimeFormatCache = new Map();
const weekdayLabelFormatters: DateTimeFormatCache = new Map();
const calendarDayFormatters: DateTimeFormatCache = new Map();

function getCachedFormatter(
  cache: DateTimeFormatCache,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  let formatter = cache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", { ...options, timeZone });
    cache.set(timeZone, formatter);
  }
  return formatter;
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

/** Format as "Sun, 19 Jul" in the given IANA timezone. */
export function formatDateLabel(date: Date, timeZone: string): string {
  const parts = getCachedFormatter(dateLabelFormatters, timeZone, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);

  return `${partValue(parts, "weekday")}, ${partValue(parts, "day")} ${partValue(parts, "month")}`;
}

/** Format as "17:00" in the given IANA timezone. */
export function formatTimeLabel(date: Date, timeZone: string): string {
  return getCachedFormatter(timeLabelFormatters, timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\u202f/g, " ");
}

/** Format as "Sunday" in the given IANA timezone. */
export function formatWeekdayLabel(date: Date, timeZone: string): string {
  return getCachedFormatter(weekdayLabelFormatters, timeZone, {
    weekday: "long",
  }).format(date);
}

/** Calendar day key (YYYY-MM-DD) in the given IANA timezone. */
export function calendarDayKey(date: Date, timeZone: string): string {
  let formatter = calendarDayFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    calendarDayFormatters.set(timeZone, formatter);
  }

  return formatter.format(date);
}
