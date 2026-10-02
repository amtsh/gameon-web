import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { generateShareToken } from "@/lib/share-token";
import { ApiError } from "./errors";
import type { ApiGame, ApiGameRelationship, ApiJoinRequest, ApiParticipant, CreateGameInput } from "./types";

type Client = SupabaseClient<Database>;
type SportEventRow = Database["public"]["Tables"]["sport_events"]["Row"];
type ShareTokenGameRow = Database["public"]["Functions"]["get_sport_event_by_share_token"]["Returns"][number];

export function toApiGame(
  row: any,
  hostName = "Player",
  distanceMeters?: number,
  relationship?: ApiGameRelationship,
  includeShareToken = false,
): ApiGame {
  return {
    id: row.id, sport: row.sport, title: row.title, description: row.description,
    skillLevel: row.skill_level, startsAt: row.starts_at, endsAt: row.ends_at,
    capacity: row.capacity, joinedCount: row.attendee_count,
    spotsLeft: Math.max(row.capacity - row.attendee_count, 0),
    venue: {
      name: row.venue_name, address: row.venue_address, city: row.venue_city, country: row.venue_country,
      latitude: row.venue_latitude, longitude: row.venue_longitude,
      ...(distanceMeters === undefined ? {} : { distanceMeters }),
    },
    cost: row.cost_amount === null || row.cost_currency === null || row.cost_mode === null
      ? null : { amount: Number(row.cost_amount), currency: row.cost_currency, mode: row.cost_mode },
    host: { id: row.host_id, name: hostName },
    autoApprove: row.auto_approve, isPrivate: row.is_private,
    cancelledAt: row.cancelled_at ?? null, createdAt: row.created_at,
    ...(includeShareToken && row.share_token ? { shareToken: row.share_token } : {}),
    ...(relationship ? { relationship } : {}),
  };
}

export function getRelationship(
  game: any,
  userId: string,
  participantIds: Set<string>,
  requestRows: Map<string, string>,
): ApiGameRelationship {
  const status = requestRows.get(game.id);
  return {
    isHost: game.host_id === userId,
    isJoined: participantIds.has(game.id),
    hasPendingRequest: status === "pending",
    isOnWaitlist: status === "waitlisted",
  };
}

export async function getHostName(client: Client, hostId: string) {
  const { data } = await client.from("public_profiles").select("name").eq("id", hostId).maybeSingle();
  return data?.name ?? "Player";
}

export async function getGame(client: Client, id: string, shareToken?: undefined): Promise<SportEventRow>;
export async function getGame(client: Client, id: string, shareToken: string): Promise<ShareTokenGameRow>;
export async function getGame(client: Client, id: string, shareToken?: string): Promise<SportEventRow | ShareTokenGameRow> {
  if (shareToken) {
    const { data, error } = await client.rpc("get_sport_event_by_share_token", { p_share_token: shareToken });
    const row = data?.[0];
    if (error || !row || row.id !== id) throw new ApiError(404, "GAME_NOT_FOUND", "Game not found.");
    return row;
  }
  const { data, error } = await client.from("sport_events").select("*").eq("id", id).maybeSingle();
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not load the game.");
  if (!data) throw new ApiError(404, "GAME_NOT_FOUND", "Game not found.");
  return data;
}

export async function createGame(client: Client, userId: string, input: CreateGameInput) {
  const { data, error } = await client.from("sport_events").insert({
    host_id: userId, sport: input.sport, title: input.title.trim(),
    description: input.description?.trim() ?? "", skill_level: input.skillLevel ?? "any",
    capacity: input.capacity, starts_at: input.startsAt, ends_at: input.endsAt,
    venue_name: input.venue.name.trim(), venue_address: input.venue.address?.trim() || null,
    venue_city: input.venue.city?.trim() || null, venue_country: input.venue.country?.trim() || null,
    venue_latitude: input.venue.latitude, venue_longitude: input.venue.longitude,
    cost_amount: input.cost?.amount ?? null, cost_currency: input.cost?.currency.toUpperCase() ?? null,
    cost_mode: input.cost?.mode ?? null, auto_approve: input.autoApprove ?? false,
    is_private: input.isPrivate ?? false, share_token: input.isPrivate ? generateShareToken() : null,
    host_contact_method: input.hostContact?.method ?? null,
    host_contact_value: input.hostContact?.value.trim() ?? null,
  }).select("*").single();

  if (error || !data) {
    if (error?.code === "23514") throw new ApiError(422, "INVALID_GAME", "Game violates a database constraint.");
    throw new ApiError(500, "DATABASE_ERROR", "Could not create the game.");
  }
  return data;
}

export async function updateGame(client: Client, userId: string, id: string, patch: Partial<CreateGameInput>) {
  const existing = await getGame(client, id);
  if (existing.host_id !== userId) throw new ApiError(403, "FORBIDDEN", "Only the host can update this game.");
  if (existing.cancelled_at) throw new ApiError(409, "GAME_CANCELLED", "Cancelled games cannot be edited.");
  if (new Date(existing.ends_at) <= new Date()) throw new ApiError(409, "GAME_ENDED", "Ended games cannot be edited.");

  const startsAt = patch.startsAt ?? existing.starts_at;
  const endsAt = patch.endsAt ?? existing.ends_at;
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  if (patch.startsAt !== undefined && starts <= new Date()) {
    throw new ApiError(422, "VALIDATION_ERROR", "startsAt must be in the future.");
  }
  if (ends <= starts) {
    throw new ApiError(422, "VALIDATION_ERROR", "endsAt must be after startsAt.");
  }
  if (ends.getTime() - starts.getTime() > 24 * 60 * 60 * 1000) {
    throw new ApiError(422, "VALIDATION_ERROR", "Games cannot last more than 24 hours.");
  }

  const values: Database["public"]["Tables"]["sport_events"]["Update"] = {};
  if (patch.sport !== undefined) values.sport = patch.sport;
  if (patch.title !== undefined) values.title = patch.title.trim();
  if (patch.description !== undefined) values.description = patch.description.trim();
  if (patch.skillLevel !== undefined) values.skill_level = patch.skillLevel;
  if (patch.capacity !== undefined) values.capacity = patch.capacity;
  if (patch.startsAt !== undefined) values.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) values.ends_at = patch.endsAt;
  if (patch.venue !== undefined) {
    values.venue_name = patch.venue.name.trim(); values.venue_address = patch.venue.address?.trim() || null;
    values.venue_city = patch.venue.city?.trim() || null; values.venue_country = patch.venue.country?.trim() || null;
    values.venue_latitude = patch.venue.latitude; values.venue_longitude = patch.venue.longitude;
  }
  if (patch.cost !== undefined) {
    values.cost_amount = patch.cost?.amount ?? null; values.cost_currency = patch.cost?.currency.toUpperCase() ?? null;
    values.cost_mode = patch.cost?.mode ?? null;
  }
  if (patch.autoApprove !== undefined) values.auto_approve = patch.autoApprove;
  if (patch.hostContact !== undefined) {
    values.host_contact_method = patch.hostContact?.method ?? null;
    values.host_contact_value = patch.hostContact?.value.trim() ?? null;
  }
  if (patch.isPrivate !== undefined && patch.isPrivate !== existing.is_private) {
    values.is_private = patch.isPrivate;
    values.share_token = patch.isPrivate ? generateShareToken() : null;
  }

  const { data, error } = await client.from("sport_events").update(values).eq("id", id).eq("host_id", userId).select("*").single();
  if (error || !data) throw new ApiError(500, "DATABASE_ERROR", "Could not update the game.");
  return data;
}

export async function cancelGame(client: Client, userId: string, id: string) {
  const existing = await getGame(client, id);
  if (existing.host_id !== userId) throw new ApiError(403, "FORBIDDEN", "Only the host can cancel this game.");
  if (existing.cancelled_at) return existing;
  const { data, error } = await client.from("sport_events").update({ cancelled_at: new Date().toISOString() }).eq("id", id).eq("host_id", userId).select("*").single();
  if (error || !data) throw new ApiError(500, "DATABASE_ERROR", "Could not cancel the game.");
  return data;
}

export async function getParticipants(client: Client, id: string, shareToken?: string): Promise<ApiParticipant[]> {
  const { data, error } = await client.rpc("get_sport_event_roster", { p_event_id: id, p_share_token: shareToken ?? null });
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not load participants.");
  return (data ?? []).map(row => ({ profileId: row.profile_id, name: row.name, skillLevel: row.requester_level, isHost: row.is_host }));
}

export async function getJoinRequests(client: Client, id: string): Promise<ApiJoinRequest[]> {
  const { data, error } = await client.from("event_join_requests")
    .select("id,event_id,requester_id,requester_level,status,created_at,approved_at")
    .eq("event_id", id).order("created_at", { ascending: true });
  if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not load join requests.");
  const ids = [...new Set((data ?? []).map(row => row.requester_id))];
  const profiles = ids.length ? await client.from("public_profiles").select("id,name").in("id", ids) : { data: [] as { id: string; name: string }[] };
  const names = new Map((profiles.data ?? []).map(p => [p.id, p.name]));
  return (data ?? []).map(row => ({
    id: row.id, gameId: row.event_id,
    requester: { id: row.requester_id, name: names.get(row.requester_id) ?? "Player" },
    skillLevel: row.requester_level, status: row.status,
    createdAt: row.created_at, approvedAt: row.approved_at,
  }));
}
