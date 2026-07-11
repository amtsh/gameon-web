"use client";

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

// Inline Google "G" logo — avoids external icon dependency
function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      height="18"
      viewBox="0 0 18 18"
      width="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

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

  const actionLabel = isWaitlist ? "Join waitlist" : "Request to join";

  return (
    <ModalSheet
      height="52svh"
      title={`Join ${event.title}`}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <div className="join-guide px-4 pb-6">
        {step === "signIn" ? (
          <>
            <h2 className="detail-title mt-4">Sign in to join this game</h2>
            <p className="detail-caption mt-2">
              We&apos;ll bring you right back here to finish joining.
            </p>
            <button
              className="google-sign-in mt-6"
              disabled={authBusy || busy}
              onClick={() => void handleSignIn()}
              type="button"
            >
              <span className="google-sign-in-icon">
                <GoogleIcon />
              </span>
              <span className="google-sign-in-label">
                {authBusy || busy ? "Redirecting\u2026" : "Continue with Google"}
              </span>
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
      </div>
    </ModalSheet>
  );
}
