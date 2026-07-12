/** Only same-origin paths — "//evil.com" or "https://evil.com" in `next`
    would otherwise turn the OAuth callback into an open redirect. */
export function safeNextPath(raw: string | null): string {
  if (!raw) return "/home";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/home";
  }
  return raw;
}
