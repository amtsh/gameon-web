"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isInstallNudgeSnoozed,
  readInstallNudgeDismissedAt,
  storeInstallNudgeDismissed,
} from "./dismissal";
import { detectPwaPlatform, isLikelyIPadOs, type PwaPlatform } from "./platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithIosFlag = window.navigator as Navigator & {
    standalone?: boolean;
  };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    navigatorWithIosFlag.standalone === true
  );
}

export function usePwaInstallPrompt() {
  const [platform, setPlatform] = useState<PwaPlatform>("unsupported");
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const detected = detectPwaPlatform(ua);
    const platformResolved =
      detected === "desktop" && isLikelyIPadOs(ua, window.navigator.maxTouchPoints)
        ? "ios"
        : detected;

    // Deferred: the lint forbids synchronous setState in effects.
    const frame = requestAnimationFrame(() => {
      setPlatform(platformResolved);
      setIsStandalone(isStandaloneDisplay());
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // Mobile only: iOS manual steps, or Android when the native prompt is available.
  const canShow =
    !isStandalone &&
    platform !== "desktop" &&
    (platform === "ios" || (platform === "android" && deferredPrompt !== null));

  const requestShow = useCallback(() => {
    if (!canShow) return false;
    const dismissedAt = readInstallNudgeDismissedAt();
    if (isInstallNudgeSnoozed(dismissedAt)) return false;
    return true;
  }, [canShow]);

  const dismiss = useCallback(() => {
    storeInstallNudgeDismissed();
  }, []);

  const promptNativeInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  }, [deferredPrompt]);

  return {
    platform,
    canInstallNatively: deferredPrompt !== null && platform !== "desktop",
    requestShow,
    dismiss,
    promptNativeInstall,
  };
}
