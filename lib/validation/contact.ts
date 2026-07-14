import { z } from "zod";

export const whatsappContactSchema = z
  .string()
  .trim()
  .regex(/^\+\d{7,}/, "Add country code (e.g. +46…)");

/** Returns a validation message for WhatsApp contact, or null if valid. */
export function whatsappContactError(
  method: string | undefined | null,
  value: string | undefined | null,
): string | null {
  if (method !== "whatsapp" || !value) return null;

  const result = whatsappContactSchema.safeParse(value);
  if (result.success) return null;

  return result.error.issues[0]?.message ?? null;
}
