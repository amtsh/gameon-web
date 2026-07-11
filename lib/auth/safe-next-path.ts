/** Only same-origin paths — "//evil.com" or "https://evil.com" in `next`
    would otherwise turn the OAuth callback into an open redirect. */
export function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return "/";
  }
  return raw;
}
