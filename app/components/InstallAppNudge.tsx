"use client";

import { Download, Share, SquarePlus, Smartphone, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { PwaPlatform } from "@/lib/pwa/platform";
import "./InstallAppNudge.css";

type Props = {
  open: boolean;
  platform: PwaPlatform;
  canInstallNatively: boolean;
  onInstallClick: () => void;
  onClose: () => void;
};

export function InstallAppNudge({
  open,
  platform,
  canInstallNatively,
  onInstallClick,
  onClose,
}: Props) {
  if (typeof document === "undefined") return null;
  if (!open) return null;

  return createPortal(
    <div className="install-nudge" role="dialog" aria-label="Install GameOn">
      <div className="install-nudge-card">
        <button
          aria-label="Dismiss"
          className="install-nudge-close"
          onClick={onClose}
          type="button"
        >
          <X size={16} strokeWidth={2.4} />
        </button>

        <div className="install-nudge-icon" aria-hidden>
          <Smartphone size={20} strokeWidth={2} />
        </div>

        <div className="install-nudge-body">
          <p className="install-nudge-title">
            {platform === "ios" ? "Add GameOn to Home Screen" : "Install GameOn"}
          </p>

          {platform === "ios" ? (
            <ol className="install-nudge-steps">
              <li>
                <Share size={14} strokeWidth={2.2} />
                Tap the Share button
              </li>
              <li>
                <SquarePlus size={14} strokeWidth={2.2} />
                Choose &ldquo;Add to Home Screen&rdquo;
              </li>
            </ol>
          ) : (
            <p className="install-nudge-caption">
              Get one-tap access and never miss a game.
            </p>
          )}
        </div>

        {canInstallNatively ? (
          <button
            className="install-nudge-action"
            onClick={onInstallClick}
            type="button"
          >
            <Download size={15} strokeWidth={2.4} />
            Install
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
