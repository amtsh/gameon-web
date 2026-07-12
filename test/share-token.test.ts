import { describe, expect, it } from "vitest";
import {
  generateShareToken,
  isShareToken,
  isUuid,
  SHARE_TOKEN_PATTERN,
  sportEventSharePath,
  sportEventShareUrl,
} from "@/lib/share-token";

describe("generateShareToken", () => {
  it("returns a human-readable slug", () => {
    const token = generateShareToken();
    expect(token).toMatch(SHARE_TOKEN_PATTERN);
  });
});

describe("isShareToken", () => {
  it("accepts human-readable ids", () => {
    expect(isShareToken("brave-ladybug-90")).toBe(true);
  });

  it("rejects uuids", () => {
    expect(isShareToken("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
  });
});

describe("isUuid", () => {
  it("accepts uuids", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects share tokens", () => {
    expect(isUuid("brave-ladybug-90")).toBe(false);
  });
});

describe("sportEventSharePath", () => {
  it("builds a public game path from the token", () => {
    expect(sportEventSharePath("brave-ladybug-90")).toBe(
      "/g/brave-ladybug-90",
    );
  });

  it("builds a private invite path when isPrivate is set", () => {
    expect(
      sportEventSharePath("brave-ladybug-90", { isPrivate: true }),
    ).toBe("/g/private/brave-ladybug-90");
  });
});

describe("sportEventShareUrl", () => {
  it("builds an absolute public url", () => {
    expect(sportEventShareUrl("brave-ladybug-90", "https://gameon.app")).toBe(
      "https://gameon.app/g/brave-ladybug-90",
    );
  });

  it("builds an absolute private invite url", () => {
    expect(
      sportEventShareUrl("brave-ladybug-90", "https://gameon.app", {
        isPrivate: true,
      }),
    ).toBe("https://gameon.app/g/private/brave-ladybug-90");
  });
});
