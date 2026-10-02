"use client";

import "./SignInSheet.css";
import { Icon } from "@iconify/react";
import { X } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { SheetDismissTrigger } from "./ModalSheet";

type Props = {
  title: string;
  description: string;
  busy?: boolean;
  onSignIn: () => void;
  buttonLabel?: string;
};

export function SignInSheet({
  title,
  description,
  busy = false,
  onSignIn,
  buttonLabel = "Continue with Google",
}: Props) {
  return (
    <>
      <header className="sheet-nav sheet-nav--transparent">
        <SheetDismissTrigger>
          <button aria-label="Close" type="button">
            <X size={20} />
          </button>
        </SheetDismissTrigger>
        <h2>Sign in</h2>
        <span />
      </header>

      <div className="auth-panel">
        <h1 className="auth-panel-title">{title}</h1>
        <p className="auth-panel-copy">{description}</p>
        <button
          className="google-sign-in auth-panel-action"
          disabled={busy}
          onClick={() => {
            haptic("light");
            onSignIn();
          }}
          type="button"
        >
          <span aria-hidden="true" className="google-sign-in-icon">
            <Icon icon="logos:google-icon" width={20} />
          </span>
          <span className="google-sign-in-label">
            {busy ? "Redirecting\u2026" : buttonLabel}
          </span>
        </button>
      </div>
    </>
  );
}
