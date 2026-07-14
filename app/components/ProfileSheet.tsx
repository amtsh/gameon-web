"use client";

import { Icon } from "@iconify/react";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  fetchSportPreferences,
  saveProfile,
  type SportPreference,
} from "@/lib/data/profile-mutations.client";
import type { Profile } from "@/lib/data/profile.shared";
import { geocodePlaceDetailed } from "@/lib/location/geocode";
import { fetchIpLocation, type IpLocation } from "@/lib/location/ip-geo.client";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";
import { DeleteAccountSheet } from "./DeleteAccountSheet";
import { SignInSheet } from "./SignInSheet";
import type { SkillLevel, SportKind } from "../types";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onContact: () => void;
  user: User | null;
  profile: Profile | null;
  authBusy: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSaved: () => void | Promise<void>;
};

const levelOptions: SkillLevel[] = ["beginner", "intermediate", "advanced"];

type AreaStatus = "idle" | "checking" | "found" | "not-found";

export function ProfileSheet({
  presented,
  onPresentedChange,
  onContact,
  user,
  profile,
  authBusy,
  onSignIn,
  onSignOut,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [detectedArea, setDetectedArea] = useState<string | null>(null);
  const [areaStatus, setAreaStatus] = useState<AreaStatus>("idle");
  const [preferences, setPreferences] = useState<SportPreference[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteSheetPresented, setDeleteSheetPresented] = useState(false);
  const areaAbortRef = useRef<AbortController | null>(null);
  // IP-derived location/country, used to scope geocode lookups to the user's own region
  // instead of always biasing toward the hardcoded default (Stockholm).
  const ipLocationRef = useRef<IpLocation>({ coordinates: null, countryCode: null });

  const lookupArea = useCallback(async (value: string) => {
    const trimmed = value.trim();
    areaAbortRef.current?.abort();

    if (!trimmed) {
      setAreaStatus("idle");
      setDetectedArea(null);
      return;
    }

    const controller = new AbortController();
    areaAbortRef.current = controller;
    setAreaStatus("checking");

    try {
      const result = await geocodePlaceDetailed(trimmed, {
        signal: controller.signal,
        bias: ipLocationRef.current.coordinates ?? undefined,
        countryCode: ipLocationRef.current.countryCode ?? undefined,
      });
      if (controller.signal.aborted) return;
      setDetectedArea(result?.label ?? null);
      setAreaStatus(result?.label ? "found" : "not-found");
    } catch {
      if (!controller.signal.aborted) {
        setDetectedArea(null);
        setAreaStatus("not-found");
      }
    }
  }, []);

  const debouncedLookupArea = useDebouncedCallback(lookupArea, 400);

  useEffect(() => {
    if (!presented || !user) return;

    const load = async () => {
      const [prefs, ipLocation] = await Promise.all([
        fetchSportPreferences(),
        fetchIpLocation(),
      ]);
      ipLocationRef.current = ipLocation;
      setPreferences(prefs);
      setName(
        profile?.name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
      );
      const initialPostalCode = profile?.postal_code ?? "";
      setPostalCode(initialPostalCode);
      debouncedLookupArea.cancel();
      void lookupArea(initialPostalCode);
      setSaveError(null);
    };

    void load();
  }, [presented, profile, user, debouncedLookupArea, lookupArea]);

  const toggleSport = (sport: SportKind) => {
    setPreferences((current) =>
      current.map((pref) =>
        pref.sport === sport
          ? { ...pref, isInterested: !pref.isInterested }
          : pref,
      ),
    );
  };

  const setLevel = (sport: SportKind, level: SkillLevel) => {
    setPreferences((current) =>
      current.map((pref) => (pref.sport === sport ? { ...pref, level } : pref)),
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveProfile({
        name,
        postalCode,
        sportPreferences: preferences,
        completeOnboarding: true,
      });
      await onSaved();
      onPresentedChange(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const interestedSports = preferences.filter((pref) => pref.isInterested);
  const showEditProfile = Boolean(user);

  return (
    <ModalSheet
      height={showEditProfile ? "96svh" : "50svh"}
      title={showEditProfile ? "Edit profile" : "Sign in"}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      {showEditProfile ? (
        <>
          <header className="sheet-nav">
            <SheetDismissTrigger>
              <button aria-label="Close" type="button">
                <X size={20} />
              </button>
            </SheetDismissTrigger>
            <h2>Edit profile</h2>
            <button
              disabled={authBusy || saving || !name.trim()}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? "Saving\u2026" : "Save"}
            </button>
          </header>

          {saveError ? <p className="form-error px-4">{saveError}</p> : null}

          <div className="profile-edit-form">
          <div className="profile-hero">
            <h1>Profile</h1>
            <p>Update your name, games, and current level.</p>
          </div>

          <div className="form-section">
            <label className="form-label">Postal code</label>
            <input
              onChange={(changeEvent) => {
                const nextValue = changeEvent.target.value;
                setPostalCode(nextValue);
                debouncedLookupArea(nextValue);
              }}
              placeholder="Postal code"
              value={postalCode}
            />
            {postalCode ? (
              <p
                className={clsx(
                  "hint",
                  areaStatus === "not-found" && "hint-warning",
                )}
              >
                {areaStatus === "checking" && "Detecting area…"}
                {areaStatus === "found" && `Area detected: ${detectedArea}`}
                {areaStatus === "not-found" &&
                  "We couldn't detect an area for this postal code."}
                {areaStatus === "idle" &&
                  `Nearby games will use postal code ${postalCode}.`}
              </p>
            ) : null}
          </div>

          <div className="form-section">
            <label className="form-label">Name</label>
            <input
              onChange={(changeEvent) => setName(changeEvent.target.value)}
              placeholder="Your name"
              value={name}
            />
          </div>

          <div className="form-section">
            <label className="form-label">Contact</label>
            <div className="contact-card">
              <Icon
                icon={
                  profile?.contact_method === "whatsapp"
                    ? "mdi:whatsapp"
                    : "mdi:telegram"
                }
                width={20}
              />
              <span className="flex-1">
                <span className="block text-[12px] font-bold uppercase text-zinc-500">
                  Shared after approval
                </span>
                <span className="font-semibold">
                  {profile?.contact_value ?? "Not set"}
                </span>
              </span>
              <button className="link-button" onClick={onContact} type="button">
                Edit
              </button>
            </div>
          </div>

          <div className="form-section">
            <p className="form-label">Interested Games</p>
            <div className="grid grid-cols-2 gap-2">
              {sports.map((sport) => {
                const pref = preferences.find((p) => p.sport === sport.id);
                return (
                  <button
                    className={clsx(
                      "sport-tile",
                      pref?.isInterested && "selected",
                    )}
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    type="button"
                  >
                    <Icon icon={sport.icon} width={20} />
                    {sport.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-section">
            <p className="form-label">Your Level</p>
            {interestedSports.map((pref) => {
              const sport = sports.find((candidate) => candidate.id === pref.sport);
              if (!sport) return null;
              return (
                <label className="stepper-row" key={pref.sport}>
                  <span className="flex items-center gap-2">
                    <Icon icon={sport.icon} width={16} />
                    {sport.label}
                  </span>
                  <select
                    onChange={(changeEvent) =>
                      setLevel(pref.sport, changeEvent.target.value as SkillLevel)
                    }
                    style={{ width: "auto" }}
                    value={pref.level === "any" ? "beginner" : pref.level}
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>

          <div className="form-section profile-account-footer">
            <div className="form-label-row">
              <p className="form-label">Account</p>
              <button
                className="link-button link-button-danger"
                onClick={() => setDeleteSheetPresented(true)}
                type="button"
              >
                (Delete)
              </button>
            </div>
            {user?.email ? (
              <p className="profile-email">{user.email}</p>
            ) : null}
            <button
              className="text-danger-action profile-sign-out"
              disabled={authBusy}
              onClick={onSignOut}
              type="button"
            >
              Sign out
            </button>
          </div>
          </div>
        </>
      ) : (
        <SignInSheet
          busy={authBusy}
          description="Sign in to create games, join events, and manage your profile."
          onSignIn={onSignIn}
          title="Welcome to Game On"
        />
      )}

      <DeleteAccountSheet
        onPresentedChange={setDeleteSheetPresented}
        presented={deleteSheetPresented}
      />
    </ModalSheet>
  );
}
