import { describe, expect, it } from "vitest";
import {
  formatSharedGameLinkTitle,
  formatSharedGameOgDate,
  formatSharedGameShareText,
} from "@/lib/seo/format-event-og";
import type { SportEvent } from "@/app/types";

/** Komethallen, Lund — used to resolve Europe/Stockholm for OG previews. */
const komethallenVenue = {
  name: "Komethallen",
  latitude: 55.7061,
  longitude: 13.1936,
};

const baseEvent: SportEvent = {
  id: "1",
  shareToken: "test-token",
  title: "Evening doubles",
  sport: "badminton",
  skillLevel: "beginner",
  startsAt: "2026-07-19T17:00:00+02:00",
  endsAt: "2026-07-19T19:00:00+02:00",
  venue: komethallenVenue,
  capacity: 4,
  joinedCount: 2,
};

describe("formatSharedGameLinkTitle", () => {
  it("prefixes sport with Join for link previews", () => {
    expect(formatSharedGameLinkTitle(baseEvent)).toBe(
      "Join Badminton - Evening doubles",
    );
  });
});

describe("formatSharedGameOgDate", () => {
  it("formats offset-stored timestamps in the venue timezone", () => {
    expect(formatSharedGameOgDate(baseEvent)).toBe(
      "Sun, 19 Jul · 17:00 – 19:00",
    );
  });

  it("formats UTC-stored timestamps in the venue timezone", () => {
    expect(
      formatSharedGameOgDate({
        ...baseEvent,
        startsAt: "2026-07-19T15:00:00.000Z",
        endsAt: "2026-07-19T17:00:00.000Z",
      }),
    ).toBe("Sun, 19 Jul · 17:00 – 19:00");
  });
});

describe("formatSharedGameShareText", () => {
  it("uses a casual invite with weekday and sport", () => {
    expect(
      formatSharedGameShareText({ ...baseEvent, joinedCount: 0 }),
    ).toBe("Hey — grab your spot for Sunday badminton");
  });

  it("urges action when only a few spots remain", () => {
    expect(formatSharedGameShareText(baseEvent)).toBe(
      "2 spots left — join on Game On",
    );
  });
});
