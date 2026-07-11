"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
};

type Method = "whatsapp" | "telegram";

export function ContactSheet({ presented, onPresentedChange }: Props) {
  const [method, setMethod] = useState<Method>("telegram");
  // Keep a separate value per method so switching tabs doesn't leak
  // a Telegram handle into the WhatsApp field (mirrors iOS, which
  // validates each method's format separately).
  const [values, setValues] = useState<Record<Method, string>>({
    telegram: "@amitplays",
    whatsapp: "",
  });

  return (
    <ModalSheet
      height="52svh"
      title="Contact"
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
        <header className="sheet-nav">
          <SheetDismissTrigger>
            <button aria-label="Close">
              <X size={20} />
            </button>
          </SheetDismissTrigger>
          <h2>Contact</h2>
          <button>Save</button>
        </header>

        <div className="form-section">
          <div className="segmented-control">
            <button
              className={method === "whatsapp" ? "selected" : ""}
              onClick={() => setMethod("whatsapp")}
            >
              WhatsApp
            </button>
            <button
              className={method === "telegram" ? "selected" : ""}
              onClick={() => setMethod("telegram")}
            >
              Telegram
            </button>
          </div>
          <input
            value={values[method]}
            inputMode={method === "whatsapp" ? "tel" : "text"}
            placeholder={method === "telegram" ? "@username" : "+46 phone"}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                [method]: changeEvent.target.value,
              }))
            }
          />
          <p className="hint">
            Your contact is shared only after a join request is approved.
          </p>
        </div>
    </ModalSheet>
  );
}
