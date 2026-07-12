import type { SkillLevel, SportKind } from "@/app/types";
import type { Profile } from "@/lib/data/profile.shared";
import { geocodePlace } from "@/lib/location/geocode";
import type { Coordinates } from "@/lib/location/geo";
import { createClient } from "@/lib/supabase/client";

export type SportPreference = {
  sport: SportKind;
  level: SkillLevel;
  isInterested: boolean;
};

export async function fetchSportPreferences(): Promise<SportPreference[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("sport_preferences")
    .select("sport, level, is_interested")
    .eq("profile_id", user.id)
    .order("sport");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    sport: row.sport,
    level: row.level,
    isInterested: row.is_interested,
  }));
}

export type SaveProfileInput = {
  name: string;
  postalCode: string;
  sportPreferences: SportPreference[];
  completeOnboarding?: boolean;
};

export async function saveProfile(input: SaveProfileInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const postalCode = input.postalCode.trim() || null;
  let coordinates: Coordinates | null = null;

  if (postalCode) {
    coordinates = await geocodePlace(postalCode);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      name: input.name.trim(),
      postal_code: postalCode,
      location_mode: postalCode ? "postal_code" : "device_location",
      postal_latitude: coordinates?.latitude ?? null,
      postal_longitude: coordinates?.longitude ?? null,
      is_onboarding_complete: input.completeOnboarding ?? true,
    })
    .eq("id", user.id);

  if (profileError) throw profileError;

  const updates = input.sportPreferences.map((pref) =>
    supabase
      .from("sport_preferences")
      .update({
        level: pref.level,
        is_interested: pref.isInterested,
      })
      .eq("profile_id", user.id)
      .eq("sport", pref.sport),
  );

  const results = await Promise.all(updates);
  const prefError = results.find((result) => result.error)?.error;
  if (prefError) throw prefError;
}

export async function saveContact(
  method: Profile["contact_method"],
  value: string,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const trimmed = value.trim();
  if (!method || !trimmed) {
    throw new Error("Contact method and value are required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      contact_method: method,
      contact_value: trimmed,
    })
    .eq("id", user.id);

  if (error) throw error;
}

/** Persist device GPS as the user\'s discovery center. */
export async function saveDiscoveryCoordinates(center: Coordinates) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const { error } = await supabase
    .from("profiles")
    .update({
      location_mode: "device_location",
      postal_latitude: center.latitude,
      postal_longitude: center.longitude,
    })
    .eq("id", user.id);

  if (error) throw error;
}

export async function sportPreferencesMap() {
  const prefs = await fetchSportPreferences();
  return new Map(prefs.map((pref) => [pref.sport, pref.level]));
}

/** Permanently delete the current user\'s account and all their data. */
export async function deleteAccount(): Promise<void> {
  const res = await fetch("/api/account/delete", { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Could not delete account");
  }
}
