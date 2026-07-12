import { describe, expect, it } from "vitest";
import { canJoinFromDetail, canSeePlayers } from "@/lib/private-game";
import { makeEvent } from "@/test/factories";

describe("canJoinFromDetail", () => {
  it("public game — allowed from home feed", () => {
    expect(canJoinFromDetail(makeEvent({ isPrivate: false }))).toBe(true);
  });

  it("public game — allowed when no context provided", () => {
    expect(canJoinFromDetail(makeEvent({}))).toBe(true);
  });

  it("private game — blocked from home feed detail", () => {
    expect(
      canJoinFromDetail(makeEvent({ isPrivate: true }), {
        openedViaShareLink: false,
      }),
    ).toBe(false);
  });

  it("private game — allowed via shared link", () => {
    expect(
      canJoinFromDetail(makeEvent({ isPrivate: true }), {
        openedViaShareLink: true,
      }),
    ).toBe(true);
  });

  it("private game — blocked when context is empty object", () => {
    expect(canJoinFromDetail(makeEvent({ isPrivate: true }), {})).toBe(false);
  });
});

describe("canSeePlayers", () => {
  it("hides players when joinedCount is 0 (public game)", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: false, joinedCount: 0 })),
    ).toBe(false);
  });

  it("hides players when joinedCount is 0 (private game)", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: true, joinedCount: 0 })),
    ).toBe(false);
  });

  it("public game — players visible from home feed", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: false, joinedCount: 3 }), {
        openedViaShareLink: false,
      }),
    ).toBe(true);
  });

  it("private game — players hidden from home feed", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: true, joinedCount: 3 }), {
        openedViaShareLink: false,
      }),
    ).toBe(false);
  });

  it("private game — players hidden when no context", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: true, joinedCount: 3 })),
    ).toBe(false);
  });

  it("private game — players visible via shared link", () => {
    expect(
      canSeePlayers(makeEvent({ isPrivate: true, joinedCount: 3 }), {
        openedViaShareLink: true,
      }),
    ).toBe(true);
  });

  it("private game — players visible for joined user without share link", () => {
    expect(
      canSeePlayers(
        makeEvent({ isPrivate: true, joinedCount: 3, isJoined: true }),
        { openedViaShareLink: false },
      ),
    ).toBe(true);
  });

  it("private game — players visible for pending request without share link", () => {
    expect(
      canSeePlayers(
        makeEvent({
          isPrivate: true,
          joinedCount: 3,
          hasPendingRequest: true,
        }),
        { openedViaShareLink: false },
      ),
    ).toBe(true);
  });

  it("private game — players visible for waitlisted user without share link", () => {
    expect(
      canSeePlayers(
        makeEvent({
          isPrivate: true,
          joinedCount: 3,
          isOnWaitlist: true,
        }),
        { openedViaShareLink: false },
      ),
    ).toBe(true);
  });

  it("private game — players visible for host without share link", () => {
    expect(
      canSeePlayers(
        makeEvent({
          isPrivate: true,
          joinedCount: 3,
          isCreatedByCurrentUser: true,
        }),
        { openedViaShareLink: false },
      ),
    ).toBe(true);
  });

  it("private game — joined user who is also host sees players", () => {
    expect(
      canSeePlayers(
        makeEvent({
          isPrivate: true,
          joinedCount: 1,
          isJoined: true,
          isCreatedByCurrentUser: true,
        }),
        {},
      ),
    ).toBe(true);
  });
});
