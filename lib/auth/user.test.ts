import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getUserAvatarUrl } from "./user";

function userWith(metadata: Record<string, unknown>): User {
  return { user_metadata: metadata } as unknown as User;
}

describe("getUserAvatarUrl", () => {
  it("returns the https avatar url", () => {
    expect(
      getUserAvatarUrl(userWith({ avatar_url: "https://cdn.example/a.png" })),
    ).toBe("https://cdn.example/a.png");
  });

  it("falls back to picture", () => {
    expect(
      getUserAvatarUrl(userWith({ picture: "https://cdn.example/p.png" })),
    ).toBe("https://cdn.example/p.png");
  });

  it("rejects non-https and malformed values (metadata is user-writable)", () => {
    expect(getUserAvatarUrl(userWith({ avatar_url: "http://x.com/a.png" }))).toBeUndefined();
    expect(getUserAvatarUrl(userWith({ avatar_url: "javascript:alert(1)" }))).toBeUndefined();
    expect(getUserAvatarUrl(userWith({ avatar_url: "not a url" }))).toBeUndefined();
    expect(getUserAvatarUrl(userWith({ avatar_url: 42 }))).toBeUndefined();
    expect(getUserAvatarUrl(null)).toBeUndefined();
  });
});
