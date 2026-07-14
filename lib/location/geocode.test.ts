import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatReverseGeocodeCity,
  formatReverseGeocodeLabel,
  geocodePlace,
  geocodePlaceDetailed,
} from "./geocode";

function stubFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

describe("formatReverseGeocodeCity", () => {
  it("returns city only when district is also present", () => {
    expect(
      formatReverseGeocodeCity({
        district: "Norrmalm",
        city: "Stockholm",
      }),
    ).toBe("Stockholm");
  });

  it("falls back to locality when city is missing", () => {
    expect(formatReverseGeocodeCity({ locality: "Klara" })).toBe("Klara");
  });
});

describe("formatReverseGeocodeLabel", () => {
  it("prefers district and city when both are present", () => {
    expect(
      formatReverseGeocodeLabel({
        district: "Norrmalm",
        city: "Stockholm",
      }),
    ).toBe("Norrmalm, Stockholm");
  });

  it("uses suburb when district is missing", () => {
    expect(
      formatReverseGeocodeLabel({
        suburb: "Södermalm",
        city: "Stockholm",
      }),
    ).toBe("Södermalm, Stockholm");
  });

  it("uses locality when it differs from the city", () => {
    expect(
      formatReverseGeocodeLabel({
        locality: "Klara",
        city: "Stockholm",
      }),
    ).toBe("Klara, Stockholm");
  });

  it("returns city only when no distinct area is available", () => {
    expect(formatReverseGeocodeLabel({ city: "Berlin" })).toBe("Berlin");
  });

  it("skips locality when it matches the city name", () => {
    expect(
      formatReverseGeocodeLabel({
        locality: "Berlin",
        city: "Berlin",
      }),
    ).toBe("Berlin");
  });
});

describe("geocodePlaceDetailed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns coordinates and an area label from a single lookup", async () => {
    stubFetchOnce({
      features: [
        {
          geometry: { coordinates: [18.0632, 59.3236] },
          properties: { suburb: "Södermalm", city: "Stockholm" },
        },
      ],
    });

    await expect(geocodePlaceDetailed("11620")).resolves.toEqual({
      coordinates: { latitude: 59.3236, longitude: 18.0632 },
      label: "Södermalm, Stockholm",
    });
  });

  it("returns null when the query is blank", async () => {
    stubFetchOnce({ features: [] });
    expect(await geocodePlaceDetailed("   ")).toBeNull();
  });

  it("returns null when the provider has no match", async () => {
    stubFetchOnce({ features: [] });
    expect(await geocodePlaceDetailed("not a real place")).toBeNull();
  });

  it("returns null when the request fails", async () => {
    stubFetchOnce({}, false);
    expect(await geocodePlaceDetailed("11620")).toBeNull();
  });

  it("biases the lookup toward the given coordinates", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          features: [
            {
              geometry: { coordinates: [18.0632, 59.3236] },
              properties: { city: "Stockholm" },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await geocodePlaceDetailed("11620", {
      bias: { latitude: 40.7128, longitude: -74.006 },
    });

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.searchParams.get("lat")).toBe("40.7128");
    expect(url.searchParams.get("lon")).toBe("-74.006");
  });

  it("prefers the Photon candidate matching the given country code", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("zippopotam")) return { ok: false, json: async () => ({}) };
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [-9.1393, 38.7223] },
              properties: { city: "Lisbon", countrycode: "pt" },
            },
            {
              geometry: { coordinates: [18.0632, 59.3236] },
              properties: { city: "Stockholm", countrycode: "se" },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("1000", { countryCode: "se" }),
    ).resolves.toEqual({
      coordinates: { latitude: 59.3236, longitude: 18.0632 },
      label: "Stockholm",
    });
  });

  it("returns null rather than a wrong-country Photon match", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("zippopotam")) return { ok: false, json: async () => ({}) };
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [-9.1393, 38.7223] },
              properties: { city: "Lisbon", countrycode: "pt" },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("1000", { countryCode: "se" }),
    ).resolves.toBeNull();
  });

  it("uses Zippopotam's exact, country-scoped match without calling Photon", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("zippopotam")) {
        return {
          ok: true,
          json: async () => ({
            places: [
              {
                "place name": "Beverly Hills",
                state: "California",
                latitude: "34.0901",
                longitude: "-118.4065",
              },
            ],
          }),
        };
      }
      throw new Error("Photon should not have been called");
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("90210", { countryCode: "us" }),
    ).resolves.toEqual({
      coordinates: { latitude: 34.0901, longitude: -118.4065 },
      label: "Beverly Hills, California",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.zippopotam.us/us/90210",
    );
  });

  it("falls back to Photon when Zippopotam has no match for the country", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("zippopotam")) {
        return { ok: false, json: async () => ({}) };
      }
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [18.0632, 59.3236] },
              properties: { city: "Stockholm", countrycode: "se" },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("11620", { countryCode: "se" }),
    ).resolves.toEqual({
      coordinates: { latitude: 59.3236, longitude: 18.0632 },
      label: "Stockholm",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to Photon when the Zippopotam request errors", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("zippopotam")) {
        throw new Error("network down");
      }
      return {
        ok: true,
        json: async () => ({
          features: [
            {
              geometry: { coordinates: [18.0632, 59.3236] },
              properties: { city: "Stockholm", countrycode: "se" },
            },
          ],
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("11620", { countryCode: "se" }),
    ).resolves.toEqual({
      coordinates: { latitude: 59.3236, longitude: 18.0632 },
      label: "Stockholm",
    });
  });

  it("propagates abort instead of falling back to Photon", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async () => {
      controller.abort();
      const error = new DOMException("Aborted", "AbortError");
      throw error;
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geocodePlaceDetailed("11620", {
        countryCode: "se",
        signal: controller.signal,
      }),
    ).rejects.toThrow("Aborted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("geocodePlace", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns just the coordinates from a detailed lookup", async () => {
    stubFetchOnce({
      features: [
        {
          geometry: { coordinates: [18.0632, 59.3236] },
          properties: { city: "Stockholm" },
        },
      ],
    });

    await expect(geocodePlace("11620")).resolves.toEqual({
      latitude: 59.3236,
      longitude: 18.0632,
    });
  });
});
