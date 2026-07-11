import { describe, expect, it } from "vitest";
import {
  parseIpCoordinates,
  readIpCoordinatesFromHeaderMap,
} from "./ip-geo";

describe("parseIpCoordinates", () => {
  it("parses valid Vercel header strings", () => {
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

describe("readIpCoordinatesFromHeaderMap", () => {
  it("reads x-vercel-ip-latitude and x-vercel-ip-longitude", () => {
    const headers = new Headers({
      "x-vercel-ip-latitude": "59.33",
      "x-vercel-ip-longitude": "18.03",
    });
    expect(readIpCoordinatesFromHeaderMap(headers)).toEqual({
      latitude: 59.33,
      longitude: 18.03,
    });
  });
});
