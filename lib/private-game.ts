import type { SportEvent } from "@/app/types";

export type PrivateGameContext = {
  /** True when the event detail was opened via /game/[id] (shared link). */
  openedViaShareLink?: boolean;
};

/**
 * Whether the viewer is allowed to request to join (or join the waitlist).
 * Private games can only be joined from a shared link.
 */
export function canJoinFromDetail(
  event: Pick<SportEvent, "isPrivate">,
  context: PrivateGameContext = {},
): boolean {
  if (!event.isPrivate) return true;
  return Boolean(context.openedViaShareLink);
}

/**
 * Whether the viewer is allowed to see the player list.
 * For private games, only the host, joined players, and share-link visitors can.
 */
export function canSeePlayers(
  event: Pick<
    SportEvent,
    | "isPrivate"
    | "isCreatedByCurrentUser"
    | "isJoined"
    | "joinedCount"
    | "hasPendingRequest"
    | "isOnWaitlist"
  >,
  context: PrivateGameContext = {},
): boolean {
  if ((event.joinedCount ?? 0) <= 0) return false;
  if (!event.isPrivate) return true;
  return Boolean(
    event.isCreatedByCurrentUser ||
      event.isJoined ||
      event.hasPendingRequest ||
      event.isOnWaitlist ||
      context.openedViaShareLink,
  );
}
