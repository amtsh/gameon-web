import type { SportEvent } from "@/app/types";
import type { Profile } from "@/lib/data/profile.shared";
import type { SportEventRow } from "@/lib/supabase/database.types";

/** Fixed reference time for deterministic tests: Sat 11 Jul 2026, 12:00 UTC. */
export const NOW = new Date("2026-07-11T12:00:00Z");

type PublicSportEventRow = Omit<
  SportEventRow,
  "host_contact_method" | "host_contact_value"
>;

export function makeSportEventRow(
  overrides: Partial<PublicSportEventRow> = {},
): PublicSportEventRow {
  return {
    id: "event-1",
    host_id: "host-1",
    sport: "badminton",
    title: "Evening doubles",
    description: "",
    cost: "",
    skill_level: "beginner",
    capacity: 8,
    attendee_count: 5,
    starts_at: "2026-07-11T16:30:00Z",
    ends_at: "2026-07-11T18:00:00Z",
    venue_name: "Eriksdalshallen",
    venue_address: "Ringvagen 70",
    venue_city: "Stockholm",
    venue_country: "SE",
    venue_latitude: 59.3072,
    venue_longitude: 18.0764,
    created_at: "2026-07-01T00:00:00Z",
    auto_approve: false,
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: "event-1",
    title: "Evening doubles",
    sport: "badminton",
    skillLevel: "beginner",
    startsAt: "2026-07-11T16:30:00Z",
    endsAt: "2026-07-11T18:00:00Z",
    venue: {
      name: "Eriksdalshallen",
      address: "Ringvagen 70",
      city: "Stockholm",
      latitude: 59.3072,
      longitude: 18.0764,
    },
    capacity: 8,
    joinedCount: 5,
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    name: "Amit",
    is_onboarding_complete: true,
    location_mode: "postal_code",
    postal_code: "112 20",
    postal_latitude: 59.33,
    postal_longitude: 18.03,
    contact_method: "telegram",
    contact_value: "@amitplays",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  } as Profile;
}
