"use client";

import { X } from "lucide-react";
import { useState } from "react";

type Props = {
  onClose: () => void;
};

export function ContactSheet({ onClose }: Props) {
  const [method, setMethod] = useState<"whatsapp" | "telegram">("telegram");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="form-sheet compact" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-nav">
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
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
            defaultValue={method === "telegram" ? "@amitplays" : ""}
            placeholder={method === "telegram" ? "@username" : "+46 phone"}
          />
          <p className="hint">
            Your contact is shared only after a join request is approved.
          </p>
        </div>
      </section>
    </div>
  );
}
