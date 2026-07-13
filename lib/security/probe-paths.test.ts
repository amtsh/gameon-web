import { describe, expect, it } from "vitest";
import { isProbePath } from "./probe-paths";

describe("isProbePath", () => {
  it("flags env and git scanners", () => {
    expect(isProbePath("/.env.local")).toBe(true);
    expect(isProbePath("/.git/refs/heads/main")).toBe(true);
  });

  it("flags common CMS and infra probes", () => {
    expect(isProbePath("/xmlrpc.php")).toBe(true);
    expect(isProbePath("/wp-admin")).toBe(true);
    expect(isProbePath("/aws/bucket")).toBe(true);
  });

  it("allows real app routes", () => {
    expect(isProbePath("/")).toBe(false);
    expect(isProbePath("/app")).toBe(false);
    expect(isProbePath("/g/tall-horse-25")).toBe(false);
    expect(isProbePath("/auth/callback")).toBe(false);
    expect(isProbePath("/api/geo")).toBe(false);
  });
});
