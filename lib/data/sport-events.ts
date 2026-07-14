import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SportEvent } from "@/app/types";
import type { Database, SportEventRow } from "@/lib/supabase/database.types";
import { getSupabaseKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/supabase/env";
import {
  DEFAULT_DISCOVERY_FILTER,
  isUserRelatedEvent,
  isWithinDiscoveryRadius,
  type DiscoveryFilter,
} from "@/lib/location/discovery";
import { boundingBoxForRadius, haversineDistanceKm } from "@/lib/location/geo";
import { isUuid } from "@/lib/share-token";

import { rowToEventCost } from "@/lib/create-event/cost";

const EVENT_COLUMNS_PUBLIC =
  "id, host_id, sport, title, description, cost_amount, cost_currency, cost_mode, skill_level, capacity, " +
  "attendee_count, starts_at, ends_at, venue_name, venue_address, venue_city, " +
  "venue_country, venue_latitude, venue_longitude, created_at, auto_approve, is_private, " +
  "cancelled_at";

const EVENT_COLUMNS_WITH_TOKEN = `${EVENT_COLUMNS_PUBLIC}, share_token`;

/** Safety cap on rows fetched per query — prevents unbounded scans for very active users/regions. */
const UPCOMING_EVENTS_LIMIT = 500;
const PAST_EVENTS_LIMIT = 200;

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
    cost: rowToEventCost(row),
    description: row.description || undefined,
    hostId: row.host_id,
    hostName,
    isCreatedByCurrentUser: isHosted,
    isJoined,
    hasPendingRequest,
    isOnWaitlist,
    pendingRequestCount: ctx.pendingRequestCounts.get(row.id),
    autoApprove: row.auto_approve,
    isPrivate: row.is_private,
    shareToken: row.share_token ?? row.id,
    isCancelled: row.cancelled_at != null,
    distanceKm: discovery
      ? haversineDistanceKm(discovery.center, venueCoords)
      : undefined,
  };
}

type UserEventRows = {
  participantEventIds: string[];
  requestRows: { event_id: string; status: string }[];
};

/** Cap on ids spliced into a PostgREST `id.in.(...)` filter — keeps the
 *  request URL bounded for users with a very large participation history. */
const RELATED_EVENT_IDS_LIMIT = 200;

/** All of the user's participant rows and live (pending/waitlisted) join
 *  requests, unfiltered by event — fetched once and reused both to build
 *  the discovery query's pre-filter and to populate loadEventContext,
 *  instead of querying the same two tables twice per loadSportEvents call. */
async function loadUserEventRows(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<UserEventRows> {
  const [participants, requests] = await Promise.all([
    supabase.from("event_participants").select("event_id").eq("profile_id", userId),
    supabase
      .from("event_join_requests")
      .select("event_id, status")
      .eq("requester_id", userId)
      .in("status", ["pending", "waitlisted"]),
  ]);

  return {
    participantEventIds: (participants.data ?? []).map((row) => row.event_id),
    requestRows: requests.data ?? [],
  };
}

/** Event ids the user is a participant of or has a live join request for. */
function relatedEventIdsFromRows(rows: UserEventRows): string[] {
  const ids = new Set<string>();
  for (const id of rows.participantEventIds) ids.add(id);
  for (const row of rows.requestRows) ids.add(row.event_id);
  return [...ids];
}

async function loadEventContext(
  supabase: SupabaseClient<Database>,
  userId: string,
  events: PublicSportEventRow[],
  userRows?: UserEventRows,
): Promise<EventContext> {
  const eventIds = new Set(events.map((event) => event.id));
  const hostedEventIds = events
    .filter((event) => event.host_id === userId)
    .map((event) => event.id);

  const rows = userRows ?? (await loadUserEventRows(supabase, userId));

  const hostedPending =
    hostedEventIds.length > 0
      ? await supabase
          .from("event_join_requests")
          .select("event_id")
          .eq("status", "pending")
          .in("event_id", hostedEventIds)
      : { data: [], error: null };

  const requestRows = rows.requestRows.filter((row) => eventIds.has(row.event_id));

  return {
    participantEventIds: new Set(
      rows.participantEventIds.filter((id) => eventIds.has(id)),
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
  const columns = userId ? EVENT_COLUMNS_WITH_TOKEN : EVENT_COLUMNS_PUBLIC;
  const bbox = boundingBoxForRadius(discovery.center, discovery.radiusKm);
  const userRows = userId ? await loadUserEventRows(supabase, userId) : undefined;
  const relatedEventIds = userRows ? relatedEventIdsFromRows(userRows) : [];

  // Push a bounding-box pre-filter (plus the user's own related events, which
  // may fall outside it) into the query so we don't scan every upcoming
  // event globally. isWithinDiscoveryRadius() below still applies the exact
  // circle — the box is a superset used only to shrink what we fetch.
  const orClauses = [
    `and(venue_latitude.gte.${bbox.minLat},venue_latitude.lte.${bbox.maxLat},` +
      `venue_longitude.gte.${bbox.minLng},venue_longitude.lte.${bbox.maxLng})`,
  ];
  if (userId) orClauses.push(`host_id.eq.${userId}`);
  if (relatedEventIds.length > 0) {
    orClauses.push(
      `id.in.(${relatedEventIds.slice(0, RELATED_EVENT_IDS_LIMIT).join(",")})`,
    );
  }

  const { data: events, error } = await supabase
    .from("sport_events")
    .select(columns)
    .gt("ends_at", new Date().toISOString())
    .or(orClauses.join(","))
    .order("starts_at", { ascending: true })
    .limit(UPCOMING_EVENTS_LIMIT)
    .overrideTypes<PublicSportEventRow[], { merge: false }>();

  if (error) throw error;
  if (events?.length === UPCOMING_EVENTS_LIMIT) {
    console.warn(
      `loadSportEvents: hit UPCOMING_EVENTS_LIMIT (${UPCOMING_EVENTS_LIMIT}) — results may be truncated`,
    );
  }
  if (!events?.length) return [];

  const hostIds = [...new Set(events.map((event) => event.host_id))];
  const { data: hosts } = await supabase
    .from("public_profiles")
    .select("id, name")
    .in("id", hostIds);

  const hostNames = new Map((hosts ?? []).map((host) => [host.id, host.name]));

  const ctx = userId
    ? await loadEventContext(supabase, userId, events, userRows)
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

/** Load a single upcoming sport event by share token or legacy UUID. */
export async function loadSportEvent(
  supabase: SupabaseClient<Database>,
  slug: string,
  userId?: string,
  discovery?: DiscoveryFilter,
): Promise<SportEvent | null> {
  let event: PublicSportEventRow | null = null;

  if (isUuid(slug)) {
    const columns = userId ? EVENT_COLUMNS_WITH_TOKEN : EVENT_COLUMNS_PUBLIC;
    const { data, error } = await supabase
      .from("sport_events")
      .select(columns)
      .eq("id", slug)
      .gt("ends_at", new Date().toISOString())
      .maybeSingle()
      .overrideTypes<PublicSportEventRow | null, { merge: false }>();

    if (error) throw error;
    event = data;
  } else {
    const { data, error } = await supabase.rpc("get_sport_event_by_share_token", {
      p_share_token: slug,
    });

    if (!error) {
      event = (data?.[0] as PublicSportEventRow | undefined) ?? null;
    }

    if (!event) {
      const { data: direct, error: directError } = await supabase
        .from("sport_events")
        .select(EVENT_COLUMNS_WITH_TOKEN)
        .eq("share_token", slug)
        .gt("ends_at", new Date().toISOString())
        .is("cancelled_at", null)
        .maybeSingle()
        .overrideTypes<PublicSportEventRow | null, { merge: false }>();

      if (!directError) {
        event = direct;
      }
    }
  }

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

/** Public share-link lookup for SEO and OG images — no cookies or user context. */
export async function loadSportEventForSeo(slug: string): Promise<SportEvent | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSupabaseKey(),
  );

  return loadSportEvent(supabase, slug);
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
    filters.push(
      `id.in.(${joinedIds.slice(0, RELATED_EVENT_IDS_LIMIT).join(",")})`,
    );
  }

  const { data: events, error } = await supabase
    .from("sport_events")
    .select(EVENT_COLUMNS_WITH_TOKEN)
    .lte("ends_at", now)
    .or(filters.join(","))
    .order("ends_at", { ascending: false })
    .limit(PAST_EVENTS_LIMIT)
    .overrideTypes<PublicSportEventRow[], { merge: false }>();

  if (error) throw error;
  if (events?.length === PAST_EVENTS_LIMIT) {
    console.warn(
      `loadPastUserSportEvents: hit PAST_EVENTS_LIMIT (${PAST_EVENTS_LIMIT}) — results may be truncated`,
    );
  }
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