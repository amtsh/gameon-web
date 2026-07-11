import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeviceCoordinates } from "./discovery.client";

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
