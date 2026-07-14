import { describe, expect, it } from "vitest";
import { parseIpCoordinates } from "./ip-geo";

describe("parseIpCoordinates", () => {
  it("parses valid geolocation strings", () => {
    expect(parseIpCoordinates("52.52", "13.405")).toEqual({
      latitude: 52.52,
      longitude: 13.405,
    });
  });

  it("returns null for missing or invalid values", () => {
    expect(parseIpCoordinates(null, "13")).toBeNull();
    expect(parseIpCoordinates("91", "0")).toBeNull();
    expect(parseIpCoordinates("not-a-number", "13")).toBeNull();
  });
});
