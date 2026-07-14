"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  COST_CURRENCIES,
  type CostCurrency,
  type CostDraft,
  type CostMode,
} from "@/lib/create-event/cost";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  draft: CostDraft;
  onSave: (draft: CostDraft) => void;
};

export function CostSheet({
  presented,
  onPresentedChange,
  draft,
  onSave,
}: Props) {
  const [mode, setMode] = useState<CostMode>("total");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CostCurrency>("SEK");

  useEffect(() => {
    if (!presented) return;

    const frame = requestAnimationFrame(() => {
      setMode(draft.mode);
      setAmount(draft.amount);
      setCurrency(draft.currency);
    });

    return () => cancelAnimationFrame(frame);
  }, [draft, presented]);

  const handleSave = () => {
    onSave({ mode, amount, currency });
    onPresentedChange(false);
  };

  return (
    <ModalSheet
      height="96svh"
      title="Cost"
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <header className="sheet-nav sheet-nav--transparent">
        <SheetDismissTrigger>
          <button aria-label="Close" type="button">
            <X size={20} />
          </button>
        </SheetDismissTrigger>
        <h2>Cost</h2>
        <button onClick={handleSave} type="button">
          Save
        </button>
      </header>

      <div className="form-section">
        <div className="segmented-control">
          <button
            className={mode === "total" ? "selected" : ""}
            onClick={() => setMode("total")}
            type="button"
          >
            Booking cost
          </button>
          <button
            className={mode === "per_person" ? "selected" : ""}
            onClick={() => setMode("per_person")}
            type="button"
          >
            Per person
          </button>
        </div>
        <div className="stepper-row">
          <span>Amount</span>
          <div className="cost-input-group">
            <input
              inputMode="decimal"
              min={0}
              onChange={(changeEvent) => setAmount(changeEvent.target.value)}
              placeholder="0"
              type="number"
              value={amount}
            />
            <select
              onChange={(changeEvent) =>
                setCurrency(changeEvent.target.value as CostCurrency)
              }
              value={currency}
            >
              {COST_CURRENCIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="hint">
          Booking cost is one price for the whole booking. Per person is what each
          player pays. Leave blank if cost is not decided yet.
        </p>
      </div>
    </ModalSheet>
  );
}
