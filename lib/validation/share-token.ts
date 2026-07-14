import { z } from "zod";

/** Matches human-readable-ids output: adjective-noun-number */
export const SHARE_TOKEN_PATTERN = /^[a-z]+-[a-z]+-[0-9]+$/;

export const shareTokenSchema = z.string().regex(SHARE_TOKEN_PATTERN);

export const uuidSchema = z.uuid();

export function isUuid(value: string): boolean {
  return uuidSchema.safeParse(value).success;
}

export function isShareToken(value: string): boolean {
  return shareTokenSchema.safeParse(value).success;
}
