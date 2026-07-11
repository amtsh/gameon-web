"use client";

import { Icon } from "@iconify/react";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const joinStarted = useRef(false);

  useEffect(() => {
    if (!presented) {
      joinStarted.current = false;
      return;
    }
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
      // Full games are routed to the waitlist by the database.
      await requestToJoin(event.id, profileForJoin, event.sport, prefs);
      await onJoined();
      onPresentedChange(false);
    },
    [event.id, event.sport, onJoined, onPresentedChange],
  );

  const completeJoinIfReady = useCallback(async () => {
    if (!profile || step !== null || joinStarted.current) return;
    joinStarted.current = true;
    setBusy(true);
    setError(null);
    try {
      await executeJoin(profile);
    } catch (joinError) {
      joinStarted.current = false;
      setError(
        joinError instanceof Error ? joinError.message : "Could not join",
      );
    } finally {
      setBusy(false);
    }
  }, [executeJoin, profile, step]);

  useEffect(() => {
    if (!presented || step !== null) return;
    // Deferred: the lint forbids synchronous setState in effects.
    const frame = requestAnimationFrame(() => void completeJoinIfReady());
    return () => cancelAnimationFrame(frame);
  }, [completeJoinIfReady, presented, step]);

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle(joinGuideReturnPath(event.id));
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
      joinStarted.current = true;
      await executeJoin(refreshedProfile);
    } catch (saveError) {
      joinStarted.current = false;
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save contact",
      );
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = step === "signIn" ? 1 : step === "contact" ? 2 : 3;
  const actionLabel = isWaitlist ? "Join waitlist" : "Request to join";

  return (
    <ModalSheet
      height="52svh"
      title={`Join ${event.title}`}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <div className="join-guide px-4 pb-6">
        <p className="join-guide-eyebrow">
          Step {stepIndex} of 2 · {actionLabel}
        </p>

        <div className="join-guide-steps" aria-hidden="true">
          <span className={stepIndex >= 1 ? "active" : ""}>Sign in</span>
          <span className="join-guide-divider" />
          <span className={stepIndex >= 2 ? "active" : ""}>Contact</span>
        </div>

        {step === "signIn" ? (
          <>
            <h2 className="detail-title mt-4">Sign in to join this game</h2>
            <p className="detail-caption mt-2">
              We&apos;ll bring you right back here to finish joining.
            </p>
            <button
              className="primary-action mt-6"
              disabled={authBusy || busy}
              onClick={() => void handleSignIn()}
              type="button"
            >
              {authBusy || busy ? "Redirecting\u2026" : "Continue with Google"}
            </button>
          </>
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

        {step === null && busy ? (
          <div className="mt-8 text-center">
            <p className="detail-body" style={{ fontWeight: 600 }}>
              Joining game\u2026
            </p>
          </div>
        ) : null}

        {error ? <p className="form-error mt-4">{error}</p> : null}

        <p className="join-guide-footnote mt-4">
          <Icon icon="mdi:shield-check-outline" width={14} />
          {event.title}
        </p>
      </div>
    </ModalSheet>
  );
}
