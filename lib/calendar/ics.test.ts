import { describe, expect, it } from "vitest";
import { buildSportEventIcs, sportEventIcsFilename } from "./ics";
import { makeEvent } from "@/test/factories";

describe("buildSportEventIcs", () => {
  const event = makeEvent({
    title: "Evening doubles; bring shoes, ok",
    description: "Line one\nLine two",
  });
  const ics = buildSportEventIcs(
    event,
    "https://gameon.app/g/brave-ladybug-90",
  );

  it("is a valid single-event calendar with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain(`UID:${event.id}@gameon`);
  });

  it("uses UTC timestamps", () => {
    expect(ics).toContain("DTSTART:20260711T163000Z");
    expect(ics).toContain("DTEND:20260711T180000Z");
  });

  it("escapes commas, semicolons, and newlines per RFC 5545", () => {
    expect(ics).toContain("SUMMARY:Evening doubles\\; bring shoes\\, ok");
    expect(ics).toContain("Line one\\nLine two");
  });

  it("includes 24h and 1h reminders", () => {
    expect(ics).toContain("TRIGGER:-PT24H");
    expect(ics).toContain("TRIGGER:-PT1H");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
  });

  it("includes venue and share link", () => {
    expect(ics).toContain("LOCATION:Eriksdalshallen\\, Ringvagen 70\\, Stockholm");
    expect(ics).toContain("URL:https://gameon.app/g/brave-ladybug-90");
  });
});

describe("sportEventIcsFilename", () => {
  it("slugifies the title", () => {
    expect(sportEventIcsFilename(makeEvent({ title: "Evening Doubles!" }))).toBe(
      "gameon-evening-doubles.ics",
    );
  });

  it("falls back for unusable titles", () => {
    expect(sportEventIcsFilename(makeEvent({ title: "!!!" }))).toBe(
      "gameon-event.ics",
    );
  });
});
