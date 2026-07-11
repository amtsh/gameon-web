import type { SportEvent } from "@/app/types";

/** RFC 5545 line endings — best compatibility with iOS Calendar and Google Calendar. */
const CRLF = "\r\n";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function sanitizeFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `gameon-${slug}.ics` : "gameon-event.ics";
}

export function sportEventIcsFilename(event: SportEvent): string {
  return sanitizeFilename(event.title);
}

/** Build an .ics file with 24h and 1h reminders before the game starts. */
export function buildSportEventIcs(
  event: SportEvent,
  eventUrl?: string,
): string {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const locationParts = [
    event.venue.name,
    event.venue.address,
    event.venue.city,
  ].filter(Boolean);

  const descriptionParts = [
    event.description?.trim(),
    eventUrl ? `Details: ${eventUrl}` : undefined,
  ].filter(Boolean);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GameOn//Sports//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@gameon`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(startsAt)}`,
    `DTEND:${formatIcsUtc(endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(locationParts.join(", "))}`,
    `GEO:${event.venue.latitude};${event.venue.longitude}`,
    ...(descriptionParts.length > 0
      ? [`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`]
      : []),
    ...(eventUrl ? [`URL:${escapeIcsText(eventUrl)}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`${event.title} starts in 24 hours`)}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`${event.title} starts in 1 hour`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join(CRLF) + CRLF;
}
