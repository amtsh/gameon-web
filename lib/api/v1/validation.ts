import { z } from "zod";
import { ApiError } from "./errors";

const sport = z.enum(["badminton","cricket","football","tennis","running","pickleball","basketball","volleyball","cycling"]);
const skillLevel = z.enum(["any","beginner","intermediate","advanced"]);
const contactMethod = z.enum(["whatsapp","telegram"]);
const costMode = z.enum(["total","per_person"]);

const venue = z.object({
  name: z.string().trim().min(1).max(160),
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

const cost = z.object({
  amount: z.number().finite().min(0).max(1000000),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/),
  mode: costMode,
}).nullable().optional();

const hostContact = z.object({
  method: contactMethod,
  value: z.string().trim().min(1).max(120),
}).nullable().optional();

const createGameBodySchema = z.object({
  sport, title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  skillLevel: skillLevel.optional(), capacity: z.number().int().min(1).max(500),
  startsAt: z.string().datetime({ offset: true }), endsAt: z.string().datetime({ offset: true }),
  venue, cost, autoApprove: z.boolean().optional(), isPrivate: z.boolean().optional(), hostContact, fillYourSpot: z.boolean().optional(),
});

function refineGameTiming(
  value: { startsAt?: string; endsAt?: string },
  ctx: z.RefinementCtx,
  options: { requireFutureStart: boolean },
) {
  if (value.startsAt !== undefined && options.requireFutureStart && new Date(value.startsAt) <= new Date()) {
    ctx.addIssue({ code: "custom", path: ["startsAt"], message: "startsAt must be in the future" });
  }
  if (value.startsAt === undefined || value.endsAt === undefined) return;

  const starts = new Date(value.startsAt);
  const ends = new Date(value.endsAt);
  if (ends <= starts) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "endsAt must be after startsAt" });
  if (ends.getTime() - starts.getTime() > 24 * 60 * 60 * 1000) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Games cannot last more than 24 hours" });
  }
}

export const createGameSchema = createGameBodySchema.superRefine((value, ctx) => {
  refineGameTiming(value, ctx, { requireFutureStart: true });
});

export const updateGameSchema = createGameBodySchema.omit({ fillYourSpot: true }).partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({ code: "custom", message: "At least one field is required" });
  }
});

export const joinGameSchema = z.object({
  skillLevel,
  contact: z.object({ method: contactMethod, value: z.string().trim().min(1).max(120) }),
  shareToken: z.string().trim().min(1).max(200).optional(),
});

export const discoverySchema = z.object({
  sport: sport.optional(), skill: skillLevel.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  lat: z.coerce.number().finite().min(-90).max(90).optional(),
  lng: z.coerce.number().finite().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().finite().positive().max(100).optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).superRefine((value, ctx) => {
  if ((value.lat === undefined) !== (value.lng === undefined)) ctx.addIssue({ code: "custom", path: ["lat"], message: "lat and lng must be provided together" });
  if (value.radiusKm !== undefined && value.lat === undefined) ctx.addIssue({ code: "custom", path: ["radiusKm"], message: "radiusKm requires lat and lng" });
  if (value.from && value.to && new Date(value.to) <= new Date(value.from)) ctx.addIssue({ code: "custom", path: ["to"], message: "to must be after from" });
});

export function parseJson<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new ApiError(422, "VALIDATION_ERROR", "Request validation failed.", { issues: result.error.issues });
  return result.data;
}
