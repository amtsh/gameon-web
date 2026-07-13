import type { SkillLevel, SportKind, Venue } from "@/app/types";
import type { EventCost } from "@/lib/create-event/cost";
import { eventCostToRow } from "@/lib/create-event/cost";
import type { Profile } from "@/lib/data/profile.shared";
import { generateShareToken } from "@/lib/share-token";
import { createClient } from "@/lib/supabase/client";

export type CreateSportEventInput = {
  sport: SportKind;
  skillLevel: SkillLevel;
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: EventCost;
  description?: string;
  venue: Venue;
  fillYourSpot: boolean;
  autoApprove: boolean;
  isPrivate: boolean;
  profile: Profile;
};

function toIsoFromLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString();
}

const SHARE_TOKEN_MAX_ATTEMPTS = 8;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export async function createSportEvent(input: CreateSportEventInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to create a game");
  }

  const startsAt = toIsoFromLocalDateTime(input.startsAt);
  const endsAt = toIsoFromLocalDateTime(input.endsAt);

  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new Error("End time must be after start time");
  }

  const costRow = eventCostToRow(input.cost);

  const baseRow = {
    host_id: user.id,
    sport: input.sport,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    ...costRow,
    skill_level: input.skillLevel,
    capacity: input.capacity,
    starts_at: startsAt,
    ends_at: endsAt,
    host_contact_method: input.profile.contact_method,
    host_contact_value: input.profile.contact_value,
    venue_name: input.venue.name,
    venue_address: input.venue.address ?? null,
    venue_city: input.venue.city ?? null,
    venue_latitude: input.venue.latitude,
    venue_longitude: input.venue.longitude,
    auto_approve: input.autoApprove,
    is_private: input.isPrivate,
  };

  let event: { id: string } | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < SHARE_TOKEN_MAX_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabase
      .from("sport_events")
      .insert({
        ...baseRow,
        share_token: generateShareToken(),
      })
      .select("id")
      .single();

    if (!error) {
      event = data;
      break;
    }

    if (!isUniqueViolation(error)) {
      throw error;
    }

    lastError = error;
  }

  if (!event) {
    throw lastError ?? new Error("Could not allocate a share link");
  }

  if (input.fillYourSpot) {
    const { error: participantError } = await supabase
      .from("event_participants")
      .insert({
        event_id: event.id,
        profile_id: user.id,
      });

    if (participantError) throw participantError;
  }

  return event.id;
}

export type UpdateSportEventInput = Omit<
  CreateSportEventInput,
  "fillYourSpot" | "profile"
> & {
  eventId: string;
  profile: Profile;
};


export async function updateSportEvent(input: UpdateSportEventInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Sign in required");

  const startsAt = toIsoFromLocalDateTime(input.startsAt);
  const endsAt = toIsoFromLocalDateTime(input.endsAt);

  if (new Date(endsAt) <= new Date(startsAt)) {
    throw new Error("End time must be after start time");
  }

  const costRow = eventCostToRow(input.cost);

  const { error } = await supabase
    .from("sport_events")
    .update({
      sport: input.sport,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      ...costRow,
      skill_level: input.skillLevel,
      capacity: input.capacity,
      starts_at: startsAt,
      ends_at: endsAt,
      host_contact_method: input.profile.contact_method,
      host_contact_value: input.profile.contact_value,
      venue_name: input.venue.name,
      venue_address: input.venue.address ?? null,
      venue_city: input.venue.city ?? null,
      venue_latitude: input.venue.latitude,
      venue_longitude: input.venue.longitude,
      auto_approve: input.autoApprove,
      is_private: input.isPrivate,
    })
    .eq("id", input.eventId)
    .eq("host_id", user.id);

  if (error) throw error;
}

export async function cancelSportEvent(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const { error } = await supabase
    .from("sport_events")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("host_id", user.id)
    .is("cancelled_at", null);

  if (error) throw error;
}
