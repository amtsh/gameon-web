import { describe, expect, it } from "vitest";
import {
  composeSessionDatetimes,
  defaultSessionFields,
  endTimeOneHourAfter,
  formatSchedulePreview,
  isSessionDateWithinLimit,
  isSessionScheduleValid,
  sessionFieldsFromDatetimes,
  shiftEndDate,
  toDateInput,
  toLocalDateTimeInput,
  toTimeInput,
} from "./session";

describe("toLocalDateTimeInput", () => {
  it("formats an ISO timestamp for datetime-local inputs", () => {
    expect(toLocalDateTimeInput("2026-07-11T16:30:00Z")).toBe(
      "2026-07-11T16:30",
    );
  });
});

describe("composeSessionDatetimes", () => {
  it("combines same-day date and times", () => {
    expect(
      composeSessionDatetimes({
        sessionDate: "2026-07-11",
        startTime: "18:00",
        endDate: "2026-07-11",
        endTime: "19:00",
      }),
    ).toEqual({
      startsAt: "2026-07-11T18:00",
      endsAt: "2026-07-11T19:00",
    });
  });

  it("does not roll end date forward — callers must supply the correct endDate", () => {
    expect(
      composeSessionDatetimes({
        sessionDate: "2026-07-11",
        startTime: "23:00",
        endDate: "2026-07-11",
        endTime: "01:00",
      }),
    ).toEqual({
      startsAt: "2026-07-11T23:00",
      endsAt: "2026-07-11T01:00",
    });
  });

  it("preserves an explicit end date from edit state", () => {
    expect(
      composeSessionDatetimes({
        sessionDate: "2026-07-11",
        startTime: "10:00",
        endDate: "2026-07-13",
        endTime: "12:00",
      }),
    ).toEqual({
      startsAt: "2026-07-11T10:00",
      endsAt: "2026-07-13T12:00",
    });
  });
});

describe("endTimeOneHourAfter", () => {
  it("adds one hour to a time value", () => {
    expect(endTimeOneHourAfter("18:00")).toBe("19:00");
    expect(endTimeOneHourAfter("23:30")).toBe("00:30");
  });
});

describe("sessionFieldsFromDatetimes", () => {
  it("maps stored timestamps into form fields", () => {
    expect(
      sessionFieldsFromDatetimes(
        "2026-07-11T16:00:00.000Z",
        "2026-07-11T17:30:00.000Z",
      ),
    ).toEqual({
      sessionDate: "2026-07-11",
      startTime: "16:00",
      endTime: "17:30",
      endDate: "2026-07-11",
    });
  });
});

describe("validation helpers", () => {
  it("accepts a valid same-day schedule", () => {
    expect(
      isSessionScheduleValid({
        sessionDate: "2026-07-11",
        startTime: "18:00",
        endDate: "2026-07-11",
        endTime: "19:00",
      }),
    ).toBe(true);
  });

  it("rejects an end time that isn't after the start time, without silently rolling to the next day", () => {
    expect(
      isSessionScheduleValid({
        sessionDate: "2026-07-11",
        startTime: "23:00",
        endDate: "2026-07-11",
        endTime: "01:00",
      }),
    ).toBe(false);
  });

  it("rejects an incomplete schedule", () => {
    expect(
      isSessionScheduleValid({
        sessionDate: "",
        startTime: "19:00",
        endDate: "2026-07-11",
        endTime: "18:00",
      }),
    ).toBe(false);
  });

  it("enforces the three-month date limit", () => {
    expect(isSessionDateWithinLimit("2026-07-11", new Date("2026-06-01"))).toBe(
      true,
    );
    expect(isSessionDateWithinLimit("2026-12-01", new Date("2026-06-01"))).toBe(
      false,
    );
  });
});

describe("defaultSessionFields", () => {
  it("returns rounded future defaults", () => {
    const fields = defaultSessionFields(new Date("2026-07-11T14:20:00"));
    expect(fields.sessionDate).toBe("2026-07-11");
    expect(fields.startTime).toBe("16:00");
    expect(fields.endTime).toBe("17:00");
    expect(fields.endDate).toBe("2026-07-11");
  });
});

describe("formatSchedulePreview", () => {
  it("renders a live schedule summary", () => {
    expect(
      formatSchedulePreview(
        "2026-07-19",
        "17:00",
        "2026-07-19",
        "19:00",
        new Date("2026-07-11T10:00:00"),
      ),
    ).toBe("Sun, 19 Jul · 17:00 – 19:00 · 2 hours");
  });
});

describe("toDateInput and toTimeInput", () => {
  it("formats date and time parts for native inputs", () => {
    const date = new Date("2026-07-11T18:30:00");
    expect(toDateInput(date)).toBe("2026-07-11");
    expect(toTimeInput(date)).toBe("18:30");
  });
});

describe("shiftEndDate", () => {
  it("keeps a same-day span same-day when the start date moves", () => {
    expect(shiftEndDate("2026-07-11", "2026-07-15", "2026-07-11")).toBe(
      "2026-07-15",
    );
  });

  it("preserves a multi-day span's length when the start date moves", () => {
    expect(shiftEndDate("2026-07-11", "2026-07-15", "2026-07-13")).toBe(
      "2026-07-17",
    );
  });

  it("is a no-op when the start date didn't change", () => {
    expect(shiftEndDate("2026-07-11", "2026-07-11", "2026-07-13")).toBe(
      "2026-07-13",
    );
  });
});
