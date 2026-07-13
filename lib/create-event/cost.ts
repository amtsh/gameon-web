export type CostMode = "total" | "per_person";

export const COST_CURRENCIES = ["SEK", "EUR", "USD", "GBP", "NOK", "DKK"] as const;

export type CostCurrency = (typeof COST_CURRENCIES)[number];

export const COST_MAX_LENGTH = 60;

export const DEFAULT_COST_CURRENCY: CostCurrency = "SEK";

export type CostDraft = {
  mode: CostMode;
  amount: string;
  currency: CostCurrency;
};

export type EventCost = {
  amount: number;
  currency: CostCurrency;
  mode: CostMode;
};

export function emptyCostDraft(): CostDraft {
  return {
    mode: "total",
    amount: "",
    currency: DEFAULT_COST_CURRENCY,
  };
}

function normalizeCurrency(currency: string): CostCurrency {
  const upper = currency.trim().toUpperCase();
  if ((COST_CURRENCIES as readonly string[]).includes(upper)) {
    return upper as CostCurrency;
  }
  return DEFAULT_COST_CURRENCY;
}

function formatAmountNumber(amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;

  return value;
}

function formatAmountLabel(value: number): string | null {
  const label = Number.isInteger(value) ? String(value) : String(value);
  if (label.includes("e") || label.includes("E")) return null;
  return label;
}

const STRUCTURED_COST_PATTERN =
  /^(\d+(?:\.\d+)?)\s*([A-Za-z]{3})\s+(total|per person)$/i;

const LEGACY_COST_PATTERN = /^(\d+(?:\.\d+)?)\s*([A-Za-z]{3})$/i;

export function formatCost(draft: CostDraft): string {
  const value = formatAmountNumber(draft.amount);
  if (value === null) return "";

  const amountLabel = formatAmountLabel(value);
  if (amountLabel === null) return "";

  const currency = normalizeCurrency(draft.currency);
  const suffix = draft.mode === "total" ? "total" : "per person";
  const formatted = `${amountLabel} ${currency} ${suffix}`;

  if (formatted.length > COST_MAX_LENGTH) {
    return "";
  }

  return formatted;
}

export function parseCost(raw: string | undefined): CostDraft {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return emptyCostDraft();

  const structured = STRUCTURED_COST_PATTERN.exec(trimmed);
  if (structured) {
    return {
      amount: structured[1],
      currency: normalizeCurrency(structured[2]),
      mode: structured[3].toLowerCase() === "per person" ? "per_person" : "total",
    };
  }

  const legacy = LEGACY_COST_PATTERN.exec(trimmed);
  if (legacy) {
    return {
      amount: legacy[1],
      currency: normalizeCurrency(legacy[2]),
      mode: "total",
    };
  }

  return emptyCostDraft();
}

export function costDraftFromEvent(cost?: EventCost): CostDraft {
  if (!cost) return emptyCostDraft();

  return {
    mode: cost.mode,
    amount: Number.isInteger(cost.amount)
      ? String(cost.amount)
      : String(cost.amount),
    currency: cost.currency,
  };
}

export function eventCostFromDraft(draft: CostDraft): EventCost | undefined {
  const value = formatAmountNumber(draft.amount);
  if (value === null) return undefined;

  return {
    amount: value,
    currency: normalizeCurrency(draft.currency),
    mode: draft.mode,
  };
}

export function rowToEventCost(row: {
  cost_amount: number | string | null;
  cost_currency: string | null;
  cost_mode: CostMode | null;
}): EventCost | undefined {
  if (
    row.cost_amount == null ||
    row.cost_currency == null ||
    row.cost_mode == null
  ) {
    return undefined;
  }

  const amount = Number(row.cost_amount);
  if (!Number.isFinite(amount)) return undefined;

  return {
    amount,
    currency: normalizeCurrency(row.cost_currency),
    mode: row.cost_mode,
  };
}

export function eventCostToRow(cost?: EventCost) {
  if (!cost) {
    return {
      cost_amount: null,
      cost_currency: null,
      cost_mode: null,
    };
  }

  return {
    cost_amount: cost.amount,
    cost_currency: cost.currency,
    cost_mode: cost.mode,
  };
}

export function displayCost(cost?: EventCost): string | undefined {
  if (!cost) return undefined;

  const amountLabel = formatAmountLabel(cost.amount);
  if (amountLabel === null) return undefined;

  const suffix = cost.mode === "total" ? "booking cost" : "per person";
  return `${amountLabel} ${cost.currency} ${suffix}`;
}
