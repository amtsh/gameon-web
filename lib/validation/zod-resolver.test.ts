import { describe, expect, it } from "vitest";
import { createEventFormSchema } from "@/lib/validation/create-event";
import { zodResolver } from "@/lib/validation/zod-resolver";

describe("zodResolver", () => {
  it("returns parsed values when the schema passes", async () => {
    const resolver = zodResolver(createEventFormSchema);
    const result = await resolver(
      {
        title: "Saturday run",
        sessionDate: "2026-07-18",
        startTime: "18:00",
        endDate: "2026-07-18",
        endTime: "20:00",
        capacity: 8,
        description: "",
      },
      undefined,
      { criteriaMode: "firstError", fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ title: "Saturday run", capacity: 8 });
  });

  it("maps schema issues to field errors", async () => {
    const resolver = zodResolver(createEventFormSchema);
    const result = await resolver(
      {
        title: "   ",
        sessionDate: "2026-07-18",
        startTime: "18:00",
        endDate: "2026-07-18",
        endTime: "20:00",
        capacity: 8,
        description: "",
      },
      undefined,
      { criteriaMode: "firstError", fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.values).toEqual({});
    expect(result.errors.title?.message).toBe("Title is required");
  });
});
