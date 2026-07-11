import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isInstallNudgeSnoozed,
  readInstallNudgeDismissedAt,
  storeInstallNudgeDismissed,
} from "./dismissal";

function mockLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

describe("readInstallNudgeDismissedAt / storeInstallNudgeDismissed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a dismissal timestamp", () => {
    mockLocalStorage();
    const now = new Date("2026-07-11T12:00:00Z");
    storeInstallNudgeDismissed(now);
    expect(readInstallNudgeDismissedAt()).toBe(now.getTime());
  });

  it("returns null when nothing was stored", () => {
    mockLocalStorage();
    expect(readInstallNudgeDismissedAt()).toBeNull();
  });

  it("ignores corrupt storage", () => {
    const store = mockLocalStorage();
    store.set("gameon-install-nudge-dismissed-at", "not-a-number");
    expect(readInstallNudgeDismissedAt()).toBeNull();
  });
});

describe("isInstallNudgeSnoozed", () => {
  const now = new Date("2026-07-11T12:00:00Z");

  it("is false when never dismissed", () => {
    expect(isInstallNudgeSnoozed(null, now)).toBe(false);
  });

  it("is true within the 14-day snooze window", () => {
    const dismissedAt = new Date("2026-07-05T12:00:00Z").getTime();
    expect(isInstallNudgeSnoozed(dismissedAt, now)).toBe(true);
  });

  it("is false once the snooze window has elapsed", () => {
    const dismissedAt = new Date("2026-06-20T12:00:00Z").getTime();
    expect(isInstallNudgeSnoozed(dismissedAt, now)).toBe(false);
  });
});
