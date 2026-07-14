import { z } from "zod";
import {
  isSessionDateWithinLimit,
  isSessionScheduleValid,
  type SessionFields,
} from "@/lib/datetime/session";

export const createEventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    sessionDate: z.string().min(1),
    startTime: z.string().min(1),
    endDate: z.string().min(1),
    endTime: z.string().min(1),
    capacity: z
      .number({ error: "Invalid capacity" })
      .refine((value) => Number.isFinite(value), "Invalid capacity")
      .min(1, "At least 1 player")
      .max(100, "100 players max"),
    description: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!isSessionDateWithinLimit(values.sessionDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Can't be more than 3 months away",
        path: ["sessionDate"],
      });
    }

    if (!isSessionScheduleValid(values as SessionFields)) {
      ctx.addIssue({
        code: "custom",
        message: "End must be after start",
        path: ["endTime"],
      });
    }
  });

export type CreateEventFormValues = z.infer<typeof createEventFormSchema>;
