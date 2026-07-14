import { describe, expect, it } from "vitest";
import {
  buildCreatePrefill,
  nextSessionDatesFromPrevious,
  pickLatestHostedEvent,
} from "./prefill";
import { toLocalDateTimeInput } from "@/lib/datetime/session";
import { NOW, makeEvent } from "@/test/factories";

describe("nextSessionDatesFromPrevious", () => {
  it("advances weekly until the start is in the future, keeping duration", () => {
    const { startsAt, endsAt } = nextSessionDatesFromPrevious(
      "2026-07-04T16:00:00Z", // one week before NOW's Saturday
      "2026-07-04T17:30:00Z",
      NOW,
    );
    expect(startsAt).toBe("2026-07-11T16:00:00.000Z");
    expect(new Date(endsAt).getTime() - new Date(startsAt).getTime()).toBe(
      90 * 60_000,
    );
  });

  it("advances multiple weeks for older events", () => {
    const { startsAt } = nextSessionDatesFromPrevious(
      "2026-06-01T10:00:00Z",
      "2026-06-01T11:00:00Z",
      NOW,
    );
    expect(new Date(startsAt).getTime()).toBeGreaterThan(NOW.getTime());
    // Same weekday and time of day.
    expect(startsAt).toBe("2026-07-13T10:00:00.000Z");
  });

  it("enforces a minimum 30 minute duration", () => {
    const { startsAt, endsAt } = nextSessionDatesFromPrevious(
      "2026-07-04T16:00:00Z",
      "2026-07-04T16:00:00Z",
      NOW,
    );
    expect(new Date(endsAt).getTime() - new Date(startsAt).getTime()).toBe(
      30 * 60_000,
    );
  });
});

describe("pickLatestHostedEvent", () => {
  it("returns the most recent hosted event", () => {
    const older = makeEvent({
      id: "older",
      isCreatedByCurrentUser: true,
      startsAt: "2026-07-01T10:00:00Z",
    });
    const newer = makeEvent({
      id: "newer",
      isCreatedByCurrentUser: true,
      startsAt: "2026-07-08T10:00:00Z",
    });
    const notMine = makeEvent({ id: "not-mine", startsAt: "2026-07-09T10:00:00Z" });

    expect(pickLatestHostedEvent([older, notMine, newer])?.id).toBe("newer");
  });

  it("returns undefined when nothing is hosted", () => {
    expect(pickLatestHostedEvent([makeEvent()])).toBeUndefined();
  });
});

describe("buildCreatePrefill", () => {
  it("copies the event fields and rolls dates forward", () => {
    const source = makeEvent({
      isCreatedByCurrentUser: true,
      autoApprove: true,
      cost: { amount: 80, currency: "SEK", mode: "total" },
      description: "Bring shoes",
    });
    const prefill = buildCreatePrefill(source);

    expect(prefill.sport).toBe(source.sport);
    expect(prefill.venue).toEqual(source.venue);
    expect(prefill.capacity).toBe(source.capacity);
    expect(prefill.autoApprove).toBe(true);
    expect(prefill.cost).toEqual({ amount: 80, currency: "SEK", mode: "total" });
    expect(prefill.description).toBe("Bring shoes");
    expect(new Date(prefill.startsAt).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("toLocalDateTimeInput", () => {
  it("formats an ISO timestamp for datetime-local inputs", () => {
    expect(toLocalDateTimeInput("2026-07-11T16:30:00Z")).toBe(
      "2026-07-11T16:30",
    );
  });
});
