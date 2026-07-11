import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl } from "./site";

describe("getSiteUrl", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it("prefers NEXT_PUBLIC_SITE_URL and strips a trailing slash", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SITE_URL: "https://gameon.example/",
      VERCEL_URL: "ignored.vercel.app",
    };
    expect(getSiteUrl()).toBe("https://gameon.example");
  });

  it("falls back to https://VERCEL_URL", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_URL: "gameon-web.vercel.app",
    };
    expect(getSiteUrl()).toBe("https://gameon-web.vercel.app");
  });

  it("uses the hardcoded default when nothing is configured", () => {
    process.env = {
      ...env,
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_URL: "",
    };
    expect(getSiteUrl()).toBe("https://gameon-web-psi.vercel.app");
  });
});
