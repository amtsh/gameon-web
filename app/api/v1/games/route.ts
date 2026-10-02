import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/v1/errors";
import { enforceRateLimit, mergeHeaders, withIdempotency } from "@/lib/api/v1/security";
import { toApiGame, getHostName, createGame } from "@/lib/api/v1/games";
import { createGameSchema, discoverySchema, parseJson } from "@/lib/api/v1/validation";
import { handleApiError, json, requestId, userClient } from "@/app/api/v1/_lib";

type DiscoveryCursor = { startsAt: string; id: string };

function decodeCursor(cursor?: string): Partial<DiscoveryCursor> {
  if (!cursor) return {};
  try {
    const value = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(cursor), c => c.charCodeAt(0))));
    if (!value.startsAt || !value.id) throw new Error();
    return value as DiscoveryCursor;
  } catch {
    throw new ApiError(400, "INVALID_CURSOR", "The cursor is invalid.");
  }
}

function encodeCursor(value: DiscoveryCursor) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))));
}

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const parsed = parseJson(discoverySchema, Object.fromEntries(new URL(request.url).searchParams));
    const rate = await enforceRateLimit(request, "discovery", "public");
    const cursor = decodeCursor(parsed.cursor);
    const admin = createAdminClient() as any;
    const { data, error } = await admin.rpc("discover_sport_events", {
      p_sport: parsed.sport ?? null, p_skill_level: parsed.skill ?? null,
      p_from: parsed.from ?? new Date().toISOString(), p_to: parsed.to ?? null,
      p_latitude: parsed.lat ?? null, p_longitude: parsed.lng ?? null,
      p_radius_km: parsed.radiusKm ?? null, p_cursor_starts_at: cursor.startsAt ?? null,
      p_cursor_id: cursor.id ?? null, p_limit: parsed.limit + 1,
    });
    if (error) throw new ApiError(500, "DATABASE_ERROR", "Could not discover games.");

    const rows = data ?? [];
    const hasMore = rows.length > parsed.limit;
    const page = hasMore ? rows.slice(0, parsed.limit) : rows;
    const ids = [...new Set(page.map((row: any) => row.host_id))];
    const profiles = ids.length ? await admin.from("public_profiles").select("id,name").in("id", ids) : { data: [] };
    const names = new Map<string, string>(
      (profiles.data ?? []).map((p: { id: string; name: string | null }) => [p.id, p.name ?? "Player"]),
    );
    const games = page.map((row: any) => toApiGame(row, names.get(row.host_id) ?? "Player", row.distance_meters ?? undefined));
    const nextCursor = hasMore ? encodeCursor({ startsAt: page.at(-1).starts_at, id: page.at(-1).id }) : null;
    return json({ data: games, pagination: { hasMore, nextCursor } }, 200, rate);
  } catch (error) {
    return handleApiError(error, id);
  }
}

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "create", user.id);
    const result = await withIdempotency(request, user.id, async () => {
      const input = parseJson(createGameSchema, await request.clone().json());
      const row = await createGame(client, user.id, input);
      return {
        status: 201,
        body: {
          data: toApiGame(row, await getHostName(client, user.id)),
          shareToken: row.is_private ? row.share_token : undefined,
        },
      };
    });
    return json(result.body, result.status, mergeHeaders(
      rate,
      new Headers({ "X-Idempotent-Replay": String(result.replayed) }),
    ));
  } catch (error) {
    return handleApiError(error, id);
  }
}
