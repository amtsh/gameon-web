"use client";

import { Icon } from "@iconify/react";

type Props = {
  title: string;
  description: string;
  busy?: boolean;
  onSignIn: () => void;
  buttonLabel?: string;
};

export function SignInPanel({
  title,
  description,
  busy = false,
  onSignIn,
  buttonLabel = "Continue with Google",
}: Props) {
  return (
    <div className="auth-panel">
      <h1 className="auth-panel-title">{title}</h1>
      <p className="auth-panel-copy">{description}</p>
      <button
        className="google-sign-in auth-panel-action"
        disabled={busy}
        onClick={onSignIn}
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
  );
}
