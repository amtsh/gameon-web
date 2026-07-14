import { z } from "zod";

export const httpsUrlSchema = z
  .url()
  .refine((url) => url.startsWith("https://"), "HTTPS only");

/** user_metadata is end-user writable via the auth API — accept https URLs only. */
export function safeHttpsUrl(candidate: unknown): string | undefined {
  if (typeof candidate !== "string" || candidate.length === 0) return undefined;

  const result = httpsUrlSchema.safeParse(candidate);
  return result.success ? result.data : undefined;
}
