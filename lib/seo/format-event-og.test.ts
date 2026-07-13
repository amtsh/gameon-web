import { describe, expect, it } from "vitest";
import { formatSharedGameOgDate } from "@/lib/seo/format-event-og";
import type { SportEvent } from "@/app/types";

const baseEvent: SportEvent = {
  id: "1",
  shareToken: "test-token",
  title: "Evening doubles",
  sport: "badminton",
  skillLevel: "beginner",
  startsAt: "2026-07-19T17:00:00+02:00",
  endsAt: "2026-07-19T19:00:00+02:00",
  venue: {
    name: "Komethallen",
    latitude: 0,
    longitude: 0,
  },
  capacity: 4,
  joinedCount: 2,
};

describe("formatSharedGameOgDate", () => {
  it("uses wall-clock times from the stored offset, not server UTC", () => {
    expect(formatSharedGameOgDate(baseEvent)).toBe(
      "Sun, 19 Jul · 17:00 – 19:00",
    );
  });
});
