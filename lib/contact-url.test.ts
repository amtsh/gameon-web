import { describe, expect, it } from "vitest";
import { contactUrl } from "./contact-url";

describe("contactUrl", () => {
  it("builds a wa.me link from a phone number, digits only", () => {
    expect(contactUrl({ method: "whatsapp", value: "+46 70-123 45 67" })).toBe(
      "https://wa.me/46701234567",
    );
  });

  it("returns null for a whatsapp value without digits", () => {
    expect(contactUrl({ method: "whatsapp", value: "call me" })).toBeNull();
  });

  it.each([
    ["@amitplays", "https://t.me/amitplays"],
    ["amitplays", "https://t.me/amitplays"],
    ["t.me/amitplays", "https://t.me/amitplays"],
    ["https://t.me/amitplays/", "https://t.me/amitplays"],
    ["https://telegram.me/amitplays", "https://t.me/amitplays"],
  ])("normalizes telegram %s", (value, expected) => {
    expect(contactUrl({ method: "telegram", value })).toBe(expected);
  });

  it("rejects telegram values that are not a handle", () => {
    expect(contactUrl({ method: "telegram", value: "not a handle!" })).toBeNull();
    expect(
      contactUrl({ method: "telegram", value: "https://evil.com/amitplays" }),
    ).toBeNull();
  });

  it("returns null for empty values", () => {
    expect(contactUrl({ method: "telegram", value: "  " })).toBeNull();
  });
});
