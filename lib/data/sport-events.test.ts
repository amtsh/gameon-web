import { describe, expect, it } from "vitest";
import { toSportEvent } from "./sport-events";
import { DEFAULT_DISCOVERY_FILTER } from "@/lib/location/discovery";
import { makeSportEventRow } from "@/test/factories";

describe("toSportEvent", () => {
  const row = makeSportEventRow({ id: "event-1", cost: "80 SEK" });

  it("maps core fields and venue", () => {
    const event = toSportEvent(row, "Amit", {
      participantEventIds: new Set(),
      pendingRequestEventIds: new Set(),
      waitlistEventIds: new Set(),
      hostedEventIds: new Set(),
      pendingRequestCounts: new Map(),
    });

    expect(event.id).toBe("event-1");
    expect(event.hostId).toBe(row.host_id);
    expect(event.hostName).toBe("Amit");
    expect(event.cost).toBe("80 SEK");
    expect(event.venue).toEqual({
      name: "Eriksdalshallen",
      address: "Ringvagen 70",
      city: "Stockholm",
      latitude: 59.3072,
      longitude: 18.0764,
    });
  });

  it("maps viewer-specific flags from context", () => {
    const event = toSportEvent(row, "Amit", {
      hostedEventIds: new Set(["event-1"]),
      participantEventIds: new Set(["event-1"]),
      pendingRequestEventIds: new Set(["event-1"]),
      waitlistEventIds: new Set(["event-1"]),
      pendingRequestCounts: new Map([["event-1", 3]]),
    });

    expect(event.isCreatedByCurrentUser).toBe(true);
    expect(event.isJoined).toBe(true);
    expect(event.hasPendingRequest).toBe(true);
    expect(event.isOnWaitlist).toBe(true);
    expect(event.pendingRequestCount).toBe(3);
  });

  it("maps isPrivate from the row", () => {
    const event = toSportEvent(
      makeSportEventRow({ is_private: true }),
      "Host",
      {
        participantEventIds: new Set(),
        pendingRequestEventIds: new Set(),
        waitlistEventIds: new Set(),
        hostedEventIds: new Set(),
        pendingRequestCounts: new Map(),
      },
    );

    expect(event.isPrivate).toBe(true);
  });

  it("maps shareToken from the row", () => {
    const event = toSportEvent(
      makeSportEventRow({ share_token: "brave-ladybug-90" }),
      "Host",
      {
        participantEventIds: new Set(),
        pendingRequestEventIds: new Set(),
        waitlistEventIds: new Set(),
        hostedEventIds: new Set(),
        pendingRequestCounts: new Map(),
      },
    );

    expect(event.shareToken).toBe("brave-ladybug-90");
  });

  it("falls back to id when share_token is null", () => {
    const event = toSportEvent(
      makeSportEventRow({ id: "event-legacy", share_token: null }),
      "Host",
      {
        participantEventIds: new Set(),
        pendingRequestEventIds: new Set(),
        waitlistEventIds: new Set(),
        hostedEventIds: new Set(),
        pendingRequestCounts: new Map(),
      },
    );

    expect(event.shareToken).toBe("event-legacy");
  });

  it("omits empty optional strings", () => {
    const sparse = makeSportEventRow({
      cost: "",
      description: "",
      venue_address: null,
      venue_city: null,
    });
    const event = toSportEvent(sparse, "Host", {
      participantEventIds: new Set(),
      pendingRequestEventIds: new Set(),
      waitlistEventIds: new Set(),
      hostedEventIds: new Set(),
      pendingRequestCounts: new Map(),
    });

    expect(event.cost).toBeUndefined();
    expect(event.description).toBeUndefined();
    expect(event.venue.address).toBeUndefined();
    expect(event.venue.city).toBeUndefined();
  });

  it("computes distance when a discovery filter is provided", () => {
    const event = toSportEvent(
      row,
      "Host",
      {
        participantEventIds: new Set(),
        pendingRequestEventIds: new Set(),
        waitlistEventIds: new Set(),
        hostedEventIds: new Set(),
        pendingRequestCounts: new Map(),
      },
      DEFAULT_DISCOVERY_FILTER,
    );

    expect(event.distanceKm).toBeGreaterThan(0);
    expect(event.distanceKm).toBeLessThan(5);
  });
});
