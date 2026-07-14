"use client";

import { WebHaptics } from "web-haptics";

/** Preset names from web-haptics' defaultPatterns, mirroring iOS's
    UIFeedbackGenerator vocabulary. */
export type HapticType =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

let client: WebHaptics | undefined;

function getClient(): WebHaptics | undefined {
  if (typeof window === "undefined") return undefined;
  if (!client) client = new WebHaptics();
  return client;
}

/** Fire a haptic pattern. No-ops silently on unsupported browsers
    (desktop, iOS Safari) since the Vibration API just isn't there. */
export function haptic(type: HapticType) {
  void getClient()?.trigger(type);
}
