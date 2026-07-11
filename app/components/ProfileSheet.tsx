"use client";

import { Icon } from "@iconify/react";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchSportPreferences,
  saveProfile,
  type SportPreference,
} from "@/lib/data/profile-mutations.client";
import type { Profile } from "@/lib/data/profile.shared";
import { sports } from "../data/mock-data";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";
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
  const [preferences, setPreferences] = useState<SportPreference[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!presented || !user) return;

    const load = async () => {
      const prefs = await fetchSportPreferences();
      setPreferences(prefs);
      setName(
        profile?.name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          "",
      );
      setPostalCode(profile?.postal_code ?? "");
      setSaveError(null);
    };

    void load();
  }, [presented, profile, user]);

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

  return (
    <ModalSheet
      height="96svh"
      title={user ? "Edit profile" : "Sign in"}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <header className="sheet-nav">
        <SheetDismissTrigger>
          <button aria-label="Close" type="button">
            <X size={20} />
          </button>
        </SheetDismissTrigger>
        <h2>{user ? "Edit profile" : "Sign in"}</h2>
        {user ? (
          <button disabled={authBusy || saving || !name.trim()} onClick={() => void handleSave()} type="button">
            {saving ? "Saving…" : "Save"}
          </button>
        ) : (
          <span />
        )}
      </header>

      {saveError ? <p className="form-error px-4">{saveError}</p> : null}

      {!user ? (
        <div className="auth-panel">
          <div className="profile-hero">
            <h1>Welcome to GameOn</h1>
            <p>
              Sign in to create games, join events, and manage your profile.
            </p>
          </div>
          <button
            className="google-sign-in"
            disabled={authBusy}
            onClick={onSignIn}
            type="button"
          >
            <span aria-hidden="true" className="google-sign-in-icon">
              <Icon icon="logos:google-icon" width={20} />
            </span>
            <span className="google-sign-in-label">Continue with Google</span>
          </button>
        </div>
      ) : (
        <>
          <div className="profile-hero">
            <h1>Profile</h1>
            <p>Update your name, games, and current level.</p>
          </div>

          <div className="form-section">
            <label className="form-label">Postal code</label>
            <input
              onChange={(changeEvent) => setPostalCode(changeEvent.target.value)}
              placeholder="Postal code"
              value={postalCode}
            />
            {postalCode ? (
              <p className="hint">
                Nearby games will use postal code {postalCode}.
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
            <p className="form-label">Games</p>
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
            <p className="form-label">Level</p>
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
            <p className="form-label">Account</p>
            {user.email ? (
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
        </>
      )}
    </ModalSheet>
  );
}
