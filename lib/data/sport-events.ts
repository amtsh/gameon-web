import type { SupabaseClient } from "@supabase/supabase-js";
import type { SportEvent } from "@/app/types";
import type { Database, SportEventRow } from "@/lib/supabase/database.types";

type EventContext = {
  participantEventIds: Set<string>;
  pendingRequestEventIds: Set<string>;
  hostedEventIds: Set<string>;
  pendingRequestCounts: Map<string, number>;
};

/** Map a DB row + viewer context to the UI SportEvent shape. */
export function toSportEvent(
  row: SportEventRow,
  hostName: string,
  ctx: EventContext,
): SportEvent {
  const isHosted = ctx.hostedEventIds.has(row.id);
  const isJoined = ctx.participantEventIds.has(row.id);
  const hasPendingRequest = ctx.pendingRequestEventIds.has(row.id);

  return {
    id: row.id,
    title: row.title,
    sport: row.sport,
    skillLevel: row.skill_level,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    venue: {
      name: row.venue_name,
      address: row.venue_address ?? undefined,
      city: row.venue_city ?? undefined,
      latitude: row.venue_latitude,
      longitude: row.venue_longitude,
    },
    capacity: row.capacity,
    joinedCount: row.attendee_count,
    cost: row.cost || undefined,
    description: row.description || undefined,
    hostName,
    hostContact:
      row.host_contact_method && row.host_contact_value
        ? { method: row.host_contact_method, value: row.host_contact_value }
        : undefined,
    isCreatedByCurrentUser: isHosted,
    isJoined,
    hasPendingRequest,
    pendingRequestCount: ctx.pendingRequestCounts.get(row.id),
  };
}

async function loadEventContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  events: SportEventRow[],
): Promise<EventContext> {
  const eventIds = events.map((event) => event.id);
  const hostedEventIds = events
    .filter((event) => event.host_id === userId)
    .map((event) => event.id);

  const [participants, requests, hostedPending] = await Promise.all([
    supabase
      .from("event_participants")
      .select("event_id")
      .eq("profile_id", userId)
      .in("event_id", eventIds),
    supabase
      .from("event_join_requests")
      .select("event_id")
      .eq("requester_id", userId)
      .eq("status", "pending")
      .in("event_id", eventIds),
    hostedEventIds.length > 0
      ? supabase
          .from("event_join_requests")
          .select("event_id")
          .eq("status", "pending")
          .in("event_id", hostedEventIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    participantEventIds: new Set(
      (participants.data ?? []).map((row) => row.event_id),
    ),
    pendingRequestEventIds: new Set(
      (requests.data ?? []).map((row) => row.event_id),
    ),
    hostedEventIds: new Set(hostedEventIds),
    pendingRequestCounts: (hostedPending.data ?? []).reduce((map, row) => {
      map.set(row.event_id, (map.get(row.event_id) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  };
}

export async function loadSportEvents(
  supabase: SupabaseClient<Database>,
  userId?: string,
): Promise<SportEvent[]> {
  const { data: events, error } = await supabase
    .from("sport_events")
    .select("*")
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw error;
  if (!events?.length) return [];

  const hostIds = [...new Set(events.map((event) => event.host_id))];
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", hostIds);

  const hostNames = new Map((hosts ?? []).map((host) => [host.id, host.name]));

  const ctx = userId
    ? await loadEventContext(supabase, userId, events)
    : {
        participantEventIds: new Set<string>(),
        pendingRequestEventIds: new Set<string>(),
        hostedEventIds: new Set<string>(),
        pendingRequestCounts: new Map<string, number>(),
      };

  return events.map((event) =>
    toSportEvent(event, hostNames.get(event.host_id) ?? "Host", ctx),
  );
}

/** Past events the signed-in user hosted or joined. */
export async function loadPastUserSportEvents(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<SportEvent[]> {
  const now = new Date().toISOString();

  const { data: participantRows, error: participantError } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("profile_id", userId);

  if (participantError) throw participantError;

  const joinedIds = (participantRows ?? []).map((row) => row.event_id);
  const filters = [`host_id.eq.${userId}`];
  if (joinedIds.length > 0) {
    filters.push(`id.in.(${joinedIds.join(",")})`);
  }

  const { data: events, error } = await supabase
    .from("sport_events")
    .select("*")
    .lte("ends_at", now)
    .or(filters.join(","))
    .order("ends_at", { ascending: false });

  if (error) throw error;
  if (!events?.length) return [];

  const hostIds = [...new Set(events.map((event) => event.host_id))];
  const { data: hosts } = await supabase
    .from("profiles")
    .select("id, name")
    .in("id", hostIds);

  const hostNames = new Map((hosts ?? []).map((host) => [host.id, host.name]));
  const ctx = await loadEventContext(supabase, userId, events);

  return events.map((event) =>
    toSportEvent(event, hostNames.get(event.host_id) ?? "Host", ctx),
  );
}
