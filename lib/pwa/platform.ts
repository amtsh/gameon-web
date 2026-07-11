export type PwaPlatform = "ios" | "android" | "desktop" | "unsupported";

/** Pure UA sniff so this is testable without a real browser. */
export function detectPwaPlatform(userAgent: string): PwaPlatform {
  const ua = userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(ua) ||
    // iPadOS 13+ reports as "MacIntosh" but is touch-capable; callers pass
    // navigator.maxTouchPoints context separately when they need that case.
    false;
  if (isIos) return "ios";
  if (/android/.test(ua)) return "android";
  if (/macintosh|windows|linux/.test(ua) && !/mobile/.test(ua)) return "desktop";
  return "unsupported";
}

/** iPadOS Safari reports itself as desktop macOS Safari but is touch-only. */
export function isLikelyIPadOs(userAgent: string, maxTouchPoints: number): boolean {
  return /macintosh/.test(userAgent.toLowerCase()) && maxTouchPoints > 1;
}
