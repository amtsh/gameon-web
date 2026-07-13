import { describe, expect, it } from "vitest";
import {
  costDraftFromEvent,
  displayCost,
  eventCostFromDraft,
  eventCostToRow,
  formatCost,
  parseCost,
  rowToEventCost,
  type CostDraft,
} from "./cost";

describe("formatCost", () => {
  it("formats total cost", () => {
    expect(
      formatCost({ mode: "total", amount: "80", currency: "SEK" }),
    ).toBe("80 SEK total");
  });

  it("formats per-person cost", () => {
    expect(
      formatCost({ mode: "per_person", amount: "20", currency: "EUR" }),
    ).toBe("20 EUR per person");
  });

  it("returns empty string when amount is blank", () => {
    expect(formatCost({ mode: "total", amount: "", currency: "SEK" })).toBe("");
    expect(formatCost({ mode: "total", amount: "   ", currency: "SEK" })).toBe(
      "",
    );
  });

  it("returns empty string for invalid amounts", () => {
    expect(
      formatCost({ mode: "total", amount: "-5", currency: "SEK" }),
    ).toBe("");
    expect(
      formatCost({ mode: "total", amount: "abc", currency: "SEK" }),
    ).toBe("");
  });

  it("returns empty for amounts that cannot be formatted safely", () => {
    expect(
      formatCost({ mode: "per_person", amount: "9".repeat(40), currency: "SEK" }),
    ).toBe("");
  });
});

describe("parseCost", () => {
  it("parses structured total and per-person values", () => {
    expect(parseCost("80 SEK total")).toEqual({
      mode: "total",
      amount: "80",
      currency: "SEK",
    });
    expect(parseCost("20 EUR per person")).toEqual({
      mode: "per_person",
      amount: "20",
      currency: "EUR",
    });
  });

  it("parses legacy amount-only strings as total", () => {
    expect(parseCost("80 SEK")).toEqual({
      mode: "total",
      amount: "80",
      currency: "SEK",
    });
    expect(parseCost("60 SEK")).toEqual({
      mode: "total",
      amount: "60",
      currency: "SEK",
    });
  });

  it("returns empty draft for blank or unparseable values", () => {
    expect(parseCost("")).toEqual({
      mode: "total",
      amount: "",
      currency: "SEK",
    });
    expect(parseCost("pay at venue")).toEqual({
      mode: "total",
      amount: "",
      currency: "SEK",
    });
  });
});

describe("formatCost and parseCost round-trip", () => {
  it("round-trips both modes", () => {
    const drafts: CostDraft[] = [
      { mode: "total", amount: "120", currency: "USD" },
      { mode: "per_person", amount: "15.5", currency: "GBP" },
    ];

    for (const draft of drafts) {
      expect(parseCost(formatCost(draft))).toEqual({
        ...draft,
        amount: draft.amount.includes(".")
          ? draft.amount
          : String(Number(draft.amount)),
      });
    }
  });
});

describe("eventCostFromDraft and row helpers", () => {
  it("round-trips through draft, event, and database row shapes", () => {
    const draft: CostDraft = {
      mode: "per_person",
      amount: "25",
      currency: "EUR",
    };
    const eventCost = eventCostFromDraft(draft);
    expect(eventCost).toEqual({
      amount: 25,
      currency: "EUR",
      mode: "per_person",
    });
    expect(costDraftFromEvent(eventCost)).toEqual(draft);
    expect(rowToEventCost(eventCostToRow(eventCost))).toEqual(eventCost);
    expect(displayCost(eventCost)).toBe("25 EUR per person");
  });

  it("uses booking cost wording for total mode", () => {
    expect(
      displayCost({ amount: 80, currency: "SEK", mode: "total" }),
    ).toBe("80 SEK booking cost");
  });
});
