import { describe, expect, it } from "vitest";
import { timeZoneForVenue } from "@/lib/date/event-timezone";

describe("timeZoneForVenue", () => {
  it("resolves IANA timezone from venue coordinates", () => {
    expect(
      timeZoneForVenue({ latitude: 55.7061, longitude: 13.1936 }),
    ).toBe("Europe/Stockholm");
  });

  it("falls back to the stored ISO offset when coordinates are missing", () => {
    expect(
      timeZoneForVenue(
        { latitude: 0, longitude: 0 },
        "2026-07-19T17:00:00+02:00",
      ),
    ).toBe("Etc/GMT-2");
  });
});
