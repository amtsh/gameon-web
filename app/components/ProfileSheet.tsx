"use client";

import { Icon } from "@iconify/react";
import type { User } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { sports } from "../data/mock-data";
import type { Profile } from "@/lib/data/profile.shared";
import { ModalSheet, SheetDismissTrigger } from "./ModalSheet";

type Props = {
  presented: boolean;
  onPresentedChange: (presented: boolean) => void;
  onContact: () => void;
  user: User | null;
  profile: Profile | null;
  authBusy: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function ProfileSheet({
  presented,
  onPresentedChange,
  onContact,
  user,
  profile,
  authBusy,
  onSignIn,
  onSignOut,
}: Props) {
  const displayName =
    profile?.name ??
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    "Player";

  return (
    <ModalSheet
      height="96svh"
      title={user ? "Edit profile" : "Sign in"}
      presented={presented}
      onPresentedChange={onPresentedChange}
    >
      <header className="sheet-nav">
        <SheetDismissTrigger>
          <button aria-label="Close">
            <X size={20} />
          </button>
        </SheetDismissTrigger>
        <h2>{user ? "Edit profile" : "Sign in"}</h2>
        {user ? <button disabled={authBusy}>Save</button> : <span />}
      </header>

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
              defaultValue={profile?.postal_code ?? ""}
              placeholder="Postal code"
            />
            {profile?.postal_code ? (
              <p className="hint">
                Nearby games will use postal code {profile.postal_code}.
              </p>
            ) : null}
          </div>

          <div className="form-section">
            <label className="form-label">Name</label>
            <input defaultValue={displayName} placeholder="Your name" />
          </div>

          <div className="form-section">
            <label className="form-label">Contact</label>
            <div className="contact-card">
              <Icon icon="mdi:telegram" width={20} />
              <span className="flex-1">
                <span className="block text-[12px] font-bold uppercase text-zinc-500">
                  Shared after approval
                </span>
                <span className="font-semibold">
                  {profile?.contact_value ?? "Not set"}
                </span>
              </span>
              <button className="link-button" onClick={onContact}>
                Edit
              </button>
            </div>
          </div>

          <div className="form-section">
            <p className="form-label">Games</p>
            <div className="grid grid-cols-2 gap-2">
              {sports.map((sport, index) => (
                <button
                  className={index < 2 ? "sport-tile selected" : "sport-tile"}
                  key={sport.id}
                >
                  <Icon icon={sport.icon} width={20} />
                  {sport.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <p className="form-label">Level</p>
            {sports.slice(0, 2).map((sport) => (
              <label className="stepper-row" key={sport.id}>
                <span className="flex items-center gap-2">
                  <Icon icon={sport.icon} width={16} />
                  {sport.label}
                </span>
                <select defaultValue="beginner" style={{ width: "auto" }}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            ))}
          </div>

          <div className="form-section">
            <button
              className="text-danger-action"
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
