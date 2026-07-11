import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISCOVERY_FILTER,
  isUserRelatedEvent,
  isWithinDiscoveryRadius,
  resolveDiscoveryCenterFromProfile,
  resolveDiscoveryFilter,
} from "./discovery";
import { DEFAULT_DISCOVERY_CENTER, DISCOVERY_RADIUS_KM } from "./constants";
import { makeProfile } from "@/test/factories";

describe("resolveDiscoveryCenterFromProfile", () => {
  it("uses the profile's postal coordinates when present", () => {
    expect(resolveDiscoveryCenterFromProfile(makeProfile())).toEqual({
      latitude: 59.33,
      longitude: 18.03,
    });
  });

  it("returns null when coordinates are missing or invalid", () => {
    expect(resolveDiscoveryCenterFromProfile(null)).toBeNull();
    expect(
      resolveDiscoveryCenterFromProfile(
        makeProfile({ postal_latitude: null, postal_longitude: null }),
      ),
    ).toBeNull();
    expect(
      resolveDiscoveryCenterFromProfile(
        makeProfile({ postal_latitude: Number.NaN }),
      ),
    ).toBeNull();
  });
});

describe("resolveDiscoveryFilter", () => {
  it("falls back to the default center for guests", () => {
    expect(resolveDiscoveryFilter(null)).toEqual({
      center: DEFAULT_DISCOVERY_CENTER,
      radiusKm: DISCOVERY_RADIUS_KM,
    });
  });
});

describe("isWithinDiscoveryRadius", () => {
  it("accepts venues inside the radius and rejects far ones", () => {
    const nearby = { latitude: 59.31, longitude: 18.07 };
    const uppsala = { latitude: 59.8586, longitude: 17.6389 }; // ~63 km away

    expect(isWithinDiscoveryRadius(nearby, DEFAULT_DISCOVERY_FILTER)).toBe(true);
    expect(isWithinDiscoveryRadius(uppsala, DEFAULT_DISCOVERY_FILTER)).toBe(false);
  });
});

describe("isUserRelatedEvent", () => {
  const ctx = {
    hostedEventIds: new Set(["h"]),
    participantEventIds: new Set(["p"]),
    pendingRequestEventIds: new Set(["r"]),
    waitlistEventIds: new Set(["w"]),
  };

  it("matches any involvement, and nothing else", () => {
    for (const id of ["h", "p", "r", "w"]) {
      expect(isUserRelatedEvent(id, ctx)).toBe(true);
    }
    expect(isUserRelatedEvent("other", ctx)).toBe(false);
  });
});
