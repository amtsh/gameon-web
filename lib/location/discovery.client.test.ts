import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DISCOVERY_CENTER_STORAGE_KEY, DEFAULT_DISCOVERY_CENTER } from "./constants";
import {
  readStoredDiscoveryCenter,
  resolveClientDiscoveryFilter,
  storeDiscoveryCenter,
} from "./discovery.client";
import { makeProfile } from "@/test/factories";

function mockBrowserStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
  vi.stubGlobal("window", { localStorage });
  vi.stubGlobal("localStorage", localStorage);
  return store;
}

describe("readStoredDiscoveryCenter / storeDiscoveryCenter", () => {
  beforeEach(() => {
    mockBrowserStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips valid coordinates", () => {
    const center = { latitude: 59.33, longitude: 18.03 };
    storeDiscoveryCenter(center);
    expect(readStoredDiscoveryCenter()).toEqual(center);
  });

  it("ignores corrupt storage", () => {
    window.localStorage.setItem(DISCOVERY_CENTER_STORAGE_KEY, "not-json");
    expect(readStoredDiscoveryCenter()).toBeNull();
  });

  it("ignores objects missing coordinates", () => {
    window.localStorage.setItem(
      DISCOVERY_CENTER_STORAGE_KEY,
      JSON.stringify({ latitude: "bad" }),
    );
    expect(readStoredDiscoveryCenter()).toBeNull();
  });
});

describe("resolveClientDiscoveryFilter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers profile coordinates", async () => {
    const filter = await resolveClientDiscoveryFilter(makeProfile());
    expect(filter.center).toEqual({ latitude: 59.33, longitude: 18.03 });
    expect(filter.radiusKm).toBe(25);
  });

  it("falls back to stored center when profile has no coords", async () => {
    mockBrowserStorage();
    storeDiscoveryCenter({ latitude: 55.6, longitude: 13.0 });
    const filter = await resolveClientDiscoveryFilter(
      makeProfile({ postal_latitude: null, postal_longitude: null }),
    );
    expect(filter.center).toEqual({ latitude: 55.6, longitude: 13.0 });
  });

  it("falls back to default when profile, storage, and GPS are unavailable", async () => {
    mockBrowserStorage();
    vi.stubGlobal("navigator", { geolocation: undefined });
    const filter = await resolveClientDiscoveryFilter(null);
    expect(filter.center).toEqual(DEFAULT_DISCOVERY_CENTER);
  });
});
