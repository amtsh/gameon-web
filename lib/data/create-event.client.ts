import type { SkillLevel, SportKind, Venue } from "@/app/types";
import type { Profile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/client";

export type CreateSportEventInput = {
  sport: SportKind;
  skillLevel: SkillLevel;
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: string;
  description?: string;
  venue: Venue;
  fillYourSpot: boolean;
  autoApprove: boolean;
  profile: Profile;
};

function toIsoFromLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString();
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

  const { data: event, error } = await supabase
    .from("sport_events")
    .insert({
      host_id: user.id,
      sport: input.sport,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      cost: input.cost?.trim() ?? "",
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
    })
    .select("id")
    .single();

  if (error) throw error;

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

  const { error } = await supabase
    .from("sport_events")
    .update({
      sport: input.sport,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      cost: input.cost?.trim() ?? "",
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
    })
    .eq("id", input.eventId)
    .eq("host_id", user.id);

  if (error) throw error;
}

export async function deleteSportEvent(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const { error } = await supabase
    .from("sport_events")
    .delete()
    .eq("id", eventId)
    .eq("host_id", user.id);

  if (error) throw error;
}
