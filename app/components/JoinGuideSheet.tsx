"use client";

import type { User } from "@supabase/supabase-js";
import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import { signInWithGoogle } from "@/lib/auth/google";
import { requestToJoin } from "@/lib/data/join-requests.client";
import type { Profile } from "@/lib/data/profile.shared";
import {
  saveContact,
  sportPreferencesMap,
} from "@/lib/data/profile-mutations.client";
import {
  getJoinGuideStep,
  joinGuideReturnPath,
} from "@/lib/join/requirements";
import { ModalSheet } from "./ModalSheet";
import { SignInPanel } from "./SignInPanel";
import type { SportEvent } from "../types";

type Props = {
  event: SportEvent;
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  user: User | null;
  profile: Profile | null;
  authBusy: boolean;
  isWaitlist: boolean;
  onProfileRefresh: () => void | Promise<void>;
  onJoined: () => void | Promise<void>;
};

type Method = "whatsapp" | "telegram";

export function JoinGuideSheet({
  event,
  presented,
  onPresentedChange,
  user,
  profile,
  authBusy,
  isWaitlist,
  onProfileRefresh,
  onJoined,
}: Props) {
  const step = getJoinGuideStep(Boolean(user), profile);
  const [method, setMethod] = useState<Method>("telegram");
  const [contactValue, setContactValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!presented) return;
    const frame = requestAnimationFrame(() => {
      setMethod(profile?.contact_method ?? "telegram");
      setContactValue(profile?.contact_value?.trim() ?? "");
      setError(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [presented, profile]);

  const executeJoin = useCallback(
    async (profileForJoin: Profile) => {
      const prefs = await sportPreferencesMap();
      await requestToJoin(event.id, profileForJoin, event.sport, prefs, {
        isPrivate: event.isPrivate,
        shareToken: event.isPrivate ? event.shareToken : undefined,
      });
      await onJoined();
      onPresentedChange(false);
    },
    [event.id, event.isPrivate, event.shareToken, event.sport, onJoined, onPresentedChange],
  );

  // User is fully ready — they tap the button to explicitly request.
  const handleJoin = async () => {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      await executeJoin(profile);
    } catch (joinError) {
      setError(
        joinError instanceof Error ? joinError.message : "Could not join",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle(
        joinGuideReturnPath(event.shareToken, event.isPrivate),
      );
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not sign in",
      );
      setBusy(false);
    }
  };

  const handleSaveContactAndJoin = async () => {
    if (!profile || !contactValue.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await saveContact(method, contactValue.trim());
      await onProfileRefresh();
      const refreshedProfile: Profile = {
        ...profile,
        contact_method: method,
        contact_value: contactValue.trim(),
      };
      await executeJoin(refreshedProfile);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save contact",
      );
    } finally {
      setBusy(false);
    }
  };

  const actionLabel = isWaitlist ? "Join waitlist" : "Request to join";

  return (
    <ModalSheet
      height="52svh"
      title={`Join ${event.title}`}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <div className={clsx("join-guide pb-6", step !== "signIn" && "px-4")}>
        {step === "signIn" ? (
          <SignInPanel
            busy={authBusy || busy}
            description="We'll bring you right back here to finish joining."
            onSignIn={() => void handleSignIn()}
            title="Sign in to join this game"
          />
        ) : null}

        {step === "contact" ? (
          <>
            <h2 className="detail-title mt-4">Add contact to join</h2>
            <p className="detail-caption mt-2">
              Shared with the host only after you&apos;re approved.
            </p>
            <div className="form-section mt-4 px-0">
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
                  setContactValue(changeEvent.target.value)
                }
                placeholder={method === "telegram" ? "@username" : "+46 phone"}
                value={contactValue}
              />
            </div>
            <button
              className="primary-action mt-4"
              disabled={busy || !contactValue.trim()}
              onClick={() => void handleSaveContactAndJoin()}
              type="button"
            >
              {busy ? "Joining\u2026" : actionLabel}
            </button>
          </>
        ) : null}

        {/* User is fully ready (signed in + has contact) — show explicit join button */}
        {step === null ? (
          <>
            <h2 className="detail-title mt-4">Ready to join</h2>
            <p className="detail-caption mt-2">
              Tap below to send your request to the host.
            </p>
            <button
              className="primary-action mt-6"
              disabled={busy}
              onClick={() => void handleJoin()}
              type="button"
            >
              {busy ? "Joining\u2026" : actionLabel}
            </button>
          </>
        ) : null}

        {error ? <p className="form-error mt-4">{error}</p> : null}
      </div>
    </ModalSheet>
  );
}
