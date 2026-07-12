import { describe, expect, it } from "vitest";
import {
  getJoinGuideStep,
  hasJoinContact,
  joinGuideReturnPath,
} from "./requirements";
import { makeProfile } from "@/test/factories";

describe("getJoinGuideStep", () => {
  it("asks guests to sign in first", () => {
    expect(getJoinGuideStep(false, null)).toBe("signIn");
  });

  it("asks signed-in users without contact info to add it", () => {
    expect(getJoinGuideStep(true, null)).toBe("contact");
    expect(
      getJoinGuideStep(true, makeProfile({ contact_value: "  " })),
    ).toBe("contact");
    expect(
      getJoinGuideStep(true, makeProfile({ contact_method: null })),
    ).toBe("contact");
  });

  it("returns null when everything is in place", () => {
    expect(getJoinGuideStep(true, makeProfile())).toBeNull();
  });
});

describe("hasJoinContact", () => {
  it("requires both a method and a non-blank value", () => {
    expect(hasJoinContact(makeProfile())).toBe(true);
    expect(hasJoinContact(makeProfile({ contact_value: "" }))).toBe(false);
    expect(hasJoinContact(null)).toBe(false);
  });
});

describe("joinGuideReturnPath", () => {
  it("returns the share URL with the join flag", () => {
    expect(joinGuideReturnPath("brave-ladybug-90")).toBe(
      "/g/brave-ladybug-90?join=1",
    );
  });

  it("uses the private invite path for private games", () => {
    expect(joinGuideReturnPath("brave-ladybug-90", true)).toBe(
      "/g/private/brave-ladybug-90?join=1",
    );
  });
});
