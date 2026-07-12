import { hri } from "human-readable-ids";

/** Matches human-readable-ids output: adjective-noun-number */
export const SHARE_TOKEN_PATTERN = /^[a-z]+-[a-z]+-[0-9]+$/;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isShareToken(value: string): boolean {
  return SHARE_TOKEN_PATTERN.test(value);
}

export function generateShareToken(): string {
  return hri.random();
}

export type SportEventShareOptions = {
  isPrivate?: boolean;
};

export function sportEventSharePath(
  shareToken: string,
  options: SportEventShareOptions = {},
): string {
  if (options.isPrivate) {
    return `/g/private/${shareToken}`;
  }
  return `/g/${shareToken}`;
}

export function sportEventShareUrl(
  shareToken: string,
  origin: string,
  options: SportEventShareOptions = {},
): string {
  return new URL(sportEventSharePath(shareToken, options), origin).toString();
}
