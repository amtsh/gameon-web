import { hri } from "human-readable-ids";
import {
  isShareToken,
  isUuid,
  SHARE_TOKEN_PATTERN,
  shareTokenSchema,
} from "@/lib/validation/share-token";

export { isShareToken, isUuid, SHARE_TOKEN_PATTERN, shareTokenSchema };

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
