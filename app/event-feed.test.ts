import { describe, expect, it } from "vitest";
import {
  activeUserEvents,
  archivedUserEvents,
  durationText,
  eventRelativeLabel,
  groupedDiscoverableEvents,
  isArchived,
  isUserRelated,
  sectionTitle,
  spotsLeft,
} from "./event-feed";
import { NOW, makeEvent } from "@/test/factories";

describe("sectionTitle", () => {
  it("labels the current day as Today", () => {
    expect(sectionTitle(new Date("2026-07-11T18:00:00Z"), NOW)).toEqual([
      "Today",
      "Saturday",
    ]);
  });

  it("labels the next day as Tomorrow", () => {
    expect(sectionTitle(new Date("2026-07-12T08:00:00Z"), NOW)).toEqual([
      "Tomorrow",
      "Sunday",
    ]);
  });

  it("labels later days with the date", () => {
    expect(sectionTitle(new Date("2026-07-14T08:00:00Z"), NOW)).toEqual([
      "14 July",
      "Tuesday",
    ]);
  });
});

describe("eventRelativeLabel", () => {
  it("says Ended for past events", () => {
    const event = makeEvent({
      startsAt: "2026-07-10T10:00:00Z",
      endsAt: "2026-07-10T11:00:00Z",
    });
    expect(eventRelativeLabel(event, NOW)).toBe("Ended");
  });

  it("says Now for in-progress events", () => {
    const event = makeEvent({
      startsAt: "2026-07-11T11:00:00Z",
      endsAt: "2026-07-11T13:00:00Z",
    });
    expect(eventRelativeLabel(event, NOW)).toBe("Now");
  });

  it.each([
    ["2026-07-11T12:30:00Z", "In 30 minutes"],
    ["2026-07-11T13:00:00Z", "In 1 hour"],
    ["2026-07-11T17:00:00Z", "In 5 hours"],
    ["2026-07-12T12:00:00Z", "In 1 day"],
    ["2026-07-14T12:00:00Z", "In 3 days"],
  ])("starting at %s → %s", (startsAt, label) => {
    const event = makeEvent({ startsAt, endsAt: "2026-07-15T00:00:00Z" });
    expect(eventRelativeLabel(event, NOW)).toBe(label);
  });
});

describe("durationText", () => {
  it.each([
    ["2026-07-11T16:00:00Z", "2026-07-11T17:00:00Z", "1h"],
    ["2026-07-11T16:00:00Z", "2026-07-11T17:30:00Z", "1.5h"],
    ["2026-07-11T16:00:00Z", "2026-07-11T17:45:00Z", "1h 45m"],
    ["2026-07-11T16:00:00Z", "2026-07-11T16:45:00Z", "45m"],
    // Degenerate range clamps to at least one minute.
    ["2026-07-11T16:00:00Z", "2026-07-11T16:00:00Z", "1m"],
  ])("%s → %s = %s", (startsAt, endsAt, expected) => {
    expect(durationText(makeEvent({ startsAt, endsAt }))).toBe(expected);
  });
});

describe("spotsLeft", () => {
  it("computes remaining capacity", () => {
    expect(spotsLeft(makeEvent({ capacity: 8, joinedCount: 5 }))).toBe(3);
  });

  it("never goes negative when over capacity", () => {
    expect(spotsLeft(makeEvent({ capacity: 8, joinedCount: 10 }))).toBe(0);
  });
});

describe("isArchived / isUserRelated", () => {
  it("archives events that have ended", () => {
    expect(isArchived(makeEvent({ endsAt: "2026-07-11T11:00:00Z" }), NOW)).toBe(true);
    expect(isArchived(makeEvent({ endsAt: "2026-07-11T13:00:00Z" }), NOW)).toBe(false);
  });

  it("treats hosting, joining, pending, and waitlist as user-related", () => {
    expect(isUserRelated(makeEvent())).toBe(false);
    expect(isUserRelated(makeEvent({ isCreatedByCurrentUser: true }))).toBe(true);
    expect(isUserRelated(makeEvent({ isJoined: true }))).toBe(true);
    expect(isUserRelated(makeEvent({ hasPendingRequest: true }))).toBe(true);
    expect(isUserRelated(makeEvent({ isOnWaitlist: true }))).toBe(true);
  });
});

describe("feed sections", () => {
  const hosted = makeEvent({
    id: "hosted",
    isCreatedByCurrentUser: true,
    startsAt: "2026-07-12T10:00:00Z",
    endsAt: "2026-07-12T11:00:00Z",
  });
  const joinedPast = makeEvent({
    id: "joined-past",
    isJoined: true,
    startsAt: "2026-07-10T10:00:00Z",
    endsAt: "2026-07-10T11:00:00Z",
  });
  const today = makeEvent({
    id: "today",
    sport: "football",
    startsAt: "2026-07-11T16:00:00Z",
    endsAt: "2026-07-11T17:00:00Z",
  });
  const tomorrow = makeEvent({
    id: "tomorrow",
    sport: "tennis",
    startsAt: "2026-07-12T16:00:00Z",
    endsAt: "2026-07-12T17:00:00Z",
  });
  const all = [tomorrow, hosted, today, joinedPast];

  it("activeUserEvents keeps only upcoming user-related events, sorted", () => {
    expect(activeUserEvents(all, NOW).map((e) => e.id)).toEqual(["hosted"]);
  });

  it("archivedUserEvents keeps only ended user-related events", () => {
    expect(archivedUserEvents(all, NOW).map((e) => e.id)).toEqual(["joined-past"]);
  });

  it("groups discoverable events by day, in order", () => {
    const sections = groupedDiscoverableEvents(all, [], NOW);
    expect(sections.map((s) => s.title[0])).toEqual(["Today", "Tomorrow"]);
    expect(sections.map((s) => s.events.map((e) => e.id))).toEqual([
      ["today"],
      ["tomorrow"],
    ]);
  });

  it("filters by selected sports", () => {
    const sections = groupedDiscoverableEvents(all, ["tennis"], NOW);
    expect(sections.flatMap((s) => s.events.map((e) => e.id))).toEqual([
      "tomorrow",
    ]);
  });

  it("excludes user-related events from discovery even when sport matches", () => {
    const sections = groupedDiscoverableEvents(all, ["badminton"], NOW);
    expect(sections).toEqual([]);
  });
});
