import type { SupabaseClient } from "@supabase/supabase-js";
import type { SportEvent } from "@/app/types";
import type { Database, SportEventRow } from "@/lib/supabase/database.types";
import {
  DEFAULT_DISCOVERY_FILTER,
  isUserRelatedEvent,
  isWithinDiscoveryRadius,
  type DiscoveryFilter,
} from "@/lib/location/discovery";
import { haversineDistanceKm } from "@/lib/location/geo";

const EVENT_COLUMNS =
  "id, host_id, sport, title, description, cost, skill_level, capacity, " +
  "attendee_count, starts_at, ends_at, venue_name, venue_address, venue_city, " +
  "venue_country, venue_latitude, venue_longitude, created_at, auto_approve";

type PublicSportEventRow = Omit<
  SportEventRow,
  "host_contact_method" | "host_contact_value"
>;

type EventContext = {
  participantEventIds: Set<string>;
  pendingRequestEventIds: Set<string>;
  waitlistEventIds: Set<string>;
  hostedEventIds: Set<string>;
  pendingRequestCounts: Map<string, number>;
};

const emptyEventContext = (): EventContext => ({
  participantEventIds: new Set(),
  pendingRequestEventIds: new Set(),
  waitlistEventIds: new Set(),
  hostedEventIds: new Set(),
  pendingRequestCounts: new Map(),
});

export function toSportEvent(
  row: PublicSportEventRow,
  hostName: string,
  ctx: EventContext,
  discovery?: DiscoveryFilter,
): SportEvent {
  const isHosted = ctx.hostedEventIds.has(row.id);
  const isJoined = ctx.participantEventIds.has(row.id);
  const hasPendingRequest = ctx.pendingRequestEventIds.has(row.id);
  const isOnWaitlist = ctx.waitlistEventIds.has(row.id);

  const venueCoords = {
    latitude: row.venue_latitude,
    longitude: row.venue_longitude,
  };

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
    hostId: row.host_id,
    hostName,
    isCreatedByCurrentUser: isHosted,
    isJoined,
    hasPendingRequest,
    isOnWaitlist,
    pendingRequestCount: ctx.pendingRequestCounts.get(row.id),
    autoApprove: row.auto_approve,
    distanceKm: discovery
      ? haversineDistanceKm(discovery.center, venueCoords)
      : undefined,
  };
}

async function loadEventContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  events: PublicSportEventRow[],
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
      .select("event_id, status")
      .eq("requester_id", userId)
      .in("status", ["pending", "waitlisted"])
      .in("event_id", eventIds),
    hostedEventIds.length > 0
      ? supabase
          .from("event_join_requests")
          .select("event_id")
          .eq("status", "pending")
          .in("event_id", hostedEventIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const requestRows = requests.data ?? [];

  return {
    participantEventIds: new Set(
      (participants.data ?? []).map((row) => row.event_id),
    ),
    pendingRequestEventIds: new Set(
      requestRows
        .filter((row) => row.status === "pending")
        .map((row) => row.event_id),
    ),
    waitlistEventIds: new Set(
      requestRows
        .filter((row) => row.status === "waitlisted")
        .map((row) => row.event_id),
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
  discovery: DiscoveryFilter = DEFAULT_DISCOVERY_FILTER,
): Promise<SportEvent[]> {
  const { data: events, error } = await supabase
    .from("sport_events")
    .select(EVENT_COLUMNS)
    .gt("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .overrideTypes<PublicSportEventRow[], { merge: false }>();

  if (error) throw error;
  if (!events?.length) return [];

  const hostIds = [...new Set(events.map((event) => event.host_id))];
  const { data: hosts } = await supabase
    .from("public_profiles")
    .select("id, name")
    .in("id", hostIds);

  const hostNames = new Map((hosts ?? []).map((host) => [host.id, host.name]));

  const ctx = userId
    ? await loadEventContext(supabase, userId, events)
    : emptyEventContext();

  const visibleEvents = events.filter((event) => {
    if (userId && isUserRelatedEvent(event.id, ctx)) return true;
    return isWithinDiscoveryRadius(
      { latitude: event.venue_latitude, longitude: event.venue_longitude },
      discovery,
    );
  });

  return visibleEvents.map((event) =>
    toSportEvent(event, hostNames.get(event.host_id) ?? "Host", ctx, discovery),
  );
}

/** Load a single upcoming sport event by ID (no radius filter — for share links). */
export async function loadSportEvent(
  supabase: SupabaseClient<Database>,
  eventId: string,
  userId?: string,
  discovery?: DiscoveryFilter,
): Promise<SportEvent | null> {
  const { data: event, error } = await supabase
    .from("sport_events")
    .select(EVENT_COLUMNS)
    .eq("id", eventId)
    .gt("ends_at", new Date().toISOString())
    .maybeSingle()
    .overrideTypes<PublicSportEventRow | null, { merge: false }>();

  if (error) throw error;
  if (!event) return null;

  const { data: host } = await supabase
    .from("public_profiles")
    .select("id, name")
    .eq("id", event.host_id)
    .maybeSingle();

  const ctx = userId
    ? await loadEventContext(supabase, userId, [event])
    : emptyEventContext();

  return toSportEvent(
    event,
    host?.name ?? "Host",
    ctx,
    discovery,
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
    .select(EVENT_COLUMNS)
    .lte("ends_at", now)
    .or(filters.join(","))
    .order("ends_at", { ascending: false })
    .overrideTypes<PublicSportEventRow[], { merge: false }>();

  if (error) throw error;
  if (!events?.length) return [];

  const hostIds = [...new Set(events.map((event) => event.host_id))];
  const { data: hosts } = await supabase
    .from("public_profiles")
    .select("id, name")
    .in("id", hostIds);

  const hostNames = new Map((hosts ?? []).map((host) => [host.id, host.name]));
  const ctx = await loadEventContext(supabase, userId, events);

  return events.map((event) =>
    toSportEvent(event, hostNames.get(event.host_id) ?? "Host", ctx),
  );
}