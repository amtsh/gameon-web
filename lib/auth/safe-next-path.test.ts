import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/g/abc?join=1")).toBe("/g/abc?join=1");
    expect(safeNextPath("/")).toBe("/");
  });

  it.each([
    [null],
    [""],
    ["//evil.com"],
    ["https://evil.com"],
    ["javascript:alert(1)"],
    ["/\\evil.com"],
    ["game/abc"], // relative, not rooted
  ])("falls back to /app for %s", (raw) => {
    expect(safeNextPath(raw)).toBe("/app");
  });
});
