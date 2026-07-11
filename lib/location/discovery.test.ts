import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISCOVERY_FILTER,
  isSameDiscoveryFilter,
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

describe("isSameDiscoveryFilter", () => {
  it("compares center and radius", () => {
    expect(isSameDiscoveryFilter(DEFAULT_DISCOVERY_FILTER, DEFAULT_DISCOVERY_FILTER)).toBe(true);
    expect(
      isSameDiscoveryFilter(DEFAULT_DISCOVERY_FILTER, {
        center: { latitude: 55, longitude: 13 },
        radiusKm: DISCOVERY_RADIUS_KM,
      }),
    ).toBe(false);
  });
});

describe("resolveDiscoveryFilter", () => {
  const gps = { latitude: 55.6, longitude: 13.0 };
  const ip = { latitude: 52.52, longitude: 13.405 };

  it("prefers GPS over postal code and IP", () => {
    expect(resolveDiscoveryFilter(makeProfile(), gps, ip)).toEqual({
      center: gps,
      radiusKm: DISCOVERY_RADIUS_KM,
    });
  });

  it("uses postal code when GPS is unavailable", () => {
    expect(resolveDiscoveryFilter(makeProfile(), null, ip)).toEqual({
      center: { latitude: 59.33, longitude: 18.03 },
      radiusKm: DISCOVERY_RADIUS_KM,
    });
  });

  it("uses IP when GPS and postal code are unavailable", () => {
    expect(resolveDiscoveryFilter(null, null, ip)).toEqual({
      center: ip,
      radiusKm: DISCOVERY_RADIUS_KM,
    });
  });

  it("falls back to Stockholm when nothing else is available", () => {
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
