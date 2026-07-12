import { describe, expect, it } from "vitest";
import { formatReverseGeocodeLabel } from "./geocode";

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
