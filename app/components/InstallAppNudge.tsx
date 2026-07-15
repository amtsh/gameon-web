"use client";

import { Download, Share, Smartphone, SquarePlus, X } from "lucide-react";
import type { PwaPlatform } from "@/lib/pwa/platform";
import { Toast } from "./Toast/Toast";
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
  return (
    <Toast.Root
      presented={open}
      onPresentedChange={(presented) => {
        if (!presented) onClose();
      }}
    >
      <Toast.Portal>
        <Toast.View className="install-nudge-toast">
          <Toast.Content className="install-nudge-content">
            <div
              className="install-nudge-card"
              role="dialog"
              aria-label="Install GameOn"
            >
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
                <Toast.Title className="install-nudge-title">
                  {platform === "ios"
                    ? "Install GameOn to Home Screen"
                    : "Install GameOn"}
                </Toast.Title>

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
                  <Toast.Description className="install-nudge-caption">
                    Get one-tap access and never miss a game.
                  </Toast.Description>
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
          </Toast.Content>
        </Toast.View>
      </Toast.Portal>
    </Toast.Root>
  );
}
