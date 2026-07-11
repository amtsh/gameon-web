import { describe, expect, it } from "vitest";
import { detectPwaPlatform, isLikelyIPadOs } from "./platform";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36";
const MAC_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";
const WINDOWS_DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

describe("detectPwaPlatform", () => {
  it("detects iOS from iPhone/iPad UAs", () => {
    expect(detectPwaPlatform(IPHONE_UA)).toBe("ios");
  });

  it("detects Android", () => {
    expect(detectPwaPlatform(ANDROID_UA)).toBe("android");
  });

  it("detects desktop for Mac and Windows", () => {
    expect(detectPwaPlatform(MAC_DESKTOP_UA)).toBe("desktop");
    expect(detectPwaPlatform(WINDOWS_DESKTOP_UA)).toBe("desktop");
  });

  it("falls back to unsupported for unrecognized UAs", () => {
    expect(detectPwaPlatform("some-weird-in-app-browser/1.0")).toBe(
      "unsupported",
    );
  });
});

describe("isLikelyIPadOs", () => {
  it("treats a touch-capable Macintosh UA as iPadOS", () => {
    expect(isLikelyIPadOs(MAC_DESKTOP_UA, 5)).toBe(true);
  });

  it("treats a non-touch Macintosh UA as real desktop", () => {
    expect(isLikelyIPadOs(MAC_DESKTOP_UA, 0)).toBe(false);
  });

  it("is false for non-Macintosh UAs regardless of touch points", () => {
    expect(isLikelyIPadOs(WINDOWS_DESKTOP_UA, 10)).toBe(false);
  });
});
