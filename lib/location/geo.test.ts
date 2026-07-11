import { describe, expect, it } from "vitest";
import { formatDistanceKm, haversineDistanceKm } from "./geo";

const stockholm = { latitude: 59.3293, longitude: 18.0686 };
const uppsala = { latitude: 59.8586, longitude: 17.6389 };

describe("haversineDistanceKm", () => {
  it("is zero for identical points", () => {
    expect(haversineDistanceKm(stockholm, stockholm)).toBe(0);
  });

  it("matches the known Stockholm–Uppsala distance (~63 km)", () => {
    const km = haversineDistanceKm(stockholm, uppsala);
    expect(km).toBeGreaterThan(60);
    expect(km).toBeLessThan(67);
  });

  it("is symmetric", () => {
    expect(haversineDistanceKm(stockholm, uppsala)).toBeCloseTo(
      haversineDistanceKm(uppsala, stockholm),
      10,
    );
  });
});

describe("formatDistanceKm", () => {
  it.each([
    [0.05, "100 m"], // clamps to a 100 m minimum
    [0.55, "550 m"],
    [1.26, "1.3 km"],
    [9.94, "9.9 km"],
    [23.4, "23 km"],
  ])("%d km → %s", (km, expected) => {
    expect(formatDistanceKm(km)).toBe(expected);
  });
});
