import { describe, expect, it } from "vitest";
import { buildRedirectPath } from "@/lib/shared-game/build-redirect-path";

describe("buildRedirectPath", () => {
  it("returns the pathname when there are no search params", () => {
    expect(buildRedirectPath("/g/brave-ladybug-90")).toBe(
      "/g/brave-ladybug-90",
    );
  });

  it("preserves query params", () => {
    expect(
      buildRedirectPath("/g/brave-ladybug-90", { join: "1" }),
    ).toBe("/g/brave-ladybug-90?join=1");
  });
});
