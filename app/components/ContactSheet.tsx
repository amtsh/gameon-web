"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { saveContact } from "@/lib/data/profile-mutations.client";
import type { Profile } from "@/lib/data/profile.shared";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  profile: Profile | null;
  onSaved: () => void | Promise<void>;
};

type Method = "whatsapp" | "telegram";

export function ContactSheet({
  presented,
  onPresentedChange,
  profile,
  onSaved,
}: Props) {
  const [method, setMethod] = useState<Method>("telegram");
  const [values, setValues] = useState<Record<Method, string>>({
    telegram: "",
    whatsapp: "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!presented) return;
    // Deferred one frame: React's lint forbids synchronous setState in
    // effects, and the reset is invisible behind the sheet-open animation.
    const frame = requestAnimationFrame(() => {
      const initialMethod = profile?.contact_method ?? "telegram";
      setMethod(initialMethod);
      setValues({
        telegram:
          profile?.contact_method === "telegram"
            ? (profile.contact_value ?? "")
            : "",
        whatsapp:
          profile?.contact_method === "whatsapp"
            ? (profile.contact_value ?? "")
            : "",
      });
      setSaveError(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [presented, profile]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveContact(method, values[method]);
      await onSaved();
      onPresentedChange(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save contact",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet
      height="52svh"
      title="Contact"
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <header className="sheet-nav">
        <SheetDismissTrigger>
          <button aria-label="Close" type="button">
            <X size={20} />
          </button>
        </SheetDismissTrigger>
        <h2>Contact</h2>
        <button disabled={saving || !values[method].trim()} onClick={() => void handleSave()} type="button">
          {saving ? "Saving…" : "Save"}
        </button>
      </header>

      {saveError ? <p className="form-error px-4">{saveError}</p> : null}

      <div className="form-section">
        <div className="segmented-control">
          <button
            className={method === "whatsapp" ? "selected" : ""}
            onClick={() => setMethod("whatsapp")}
            type="button"
          >
            WhatsApp
          </button>
          <button
            className={method === "telegram" ? "selected" : ""}
            onClick={() => setMethod("telegram")}
            type="button"
          >
            Telegram
          </button>
        </div>
        <input
          inputMode={method === "whatsapp" ? "tel" : "text"}
          onChange={(changeEvent) =>
            setValues((current) => ({
              ...current,
              [method]: changeEvent.target.value,
            }))
          }
          placeholder={method === "telegram" ? "@username" : "+46 phone"}
          value={values[method]}
        />
        <p className="hint">
          Your contact is shared only after a join request is approved.
        </p>
      </div>
    </ModalSheet>
  );
}
