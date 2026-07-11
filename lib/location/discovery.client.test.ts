import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDeviceCoordinates,
  resolveDiscoveryLocationLabel,
} from "./discovery.client";
import * as geocode from "./geocode";
import { makeProfile } from "@/test/factories";

describe("getDeviceCoordinates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves browser geolocation coordinates", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (
          success: PositionCallback,
        ) => {
          success({
            coords: { latitude: 59.33, longitude: 18.03 },
          } as GeolocationPosition);
        },
      },
    });

    await expect(getDeviceCoordinates()).resolves.toEqual({
      latitude: 59.33,
      longitude: 18.03,
    });
  });

  it("rejects when geolocation is unavailable", async () => {
    vi.stubGlobal("navigator", { geolocation: undefined });
    await expect(getDeviceCoordinates()).rejects.toThrow(/Geolocation unavailable/);
  });
});

describe("resolveDiscoveryLocationLabel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns postal code when discovery uses profile", async () => {
    await expect(resolveDiscoveryLocationLabel(makeProfile())).resolves.toBe(
      "112 20",
    );
  });

  it("reverse-geocodes when discovery uses GPS", async () => {
    vi.spyOn(geocode, "reverseGeocodeCity").mockResolvedValue("Malmö");
    const gps = { latitude: 55.6, longitude: 13.0 };

    await expect(resolveDiscoveryLocationLabel(null, gps)).resolves.toBe("Malmö");
  });

  it("falls back to Stockholm when reverse geocode fails", async () => {
    vi.spyOn(geocode, "reverseGeocodeCity").mockResolvedValue(null);
    const ip = { latitude: 52.52, longitude: 13.405 };

    await expect(resolveDiscoveryLocationLabel(null, null, ip)).resolves.toBe(
      "Stockholm",
    );
  });
});
