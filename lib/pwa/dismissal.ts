const STORAGE_KEY = "gameon-install-nudge-dismissed-at";
const SNOOZE_DAYS = 14;

export function readInstallNudgeDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeInstallNudgeDismissed(now: Date = new Date()) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(now.getTime()));
}

/** Whether enough time has passed since the last dismissal to nudge again. */
export function isInstallNudgeSnoozed(
  dismissedAt: number | null,
  now: Date = new Date(),
): boolean {
  if (dismissedAt === null) return false;
  const elapsedMs = now.getTime() - dismissedAt;
  return elapsedMs < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
}
