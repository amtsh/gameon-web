import { withIdempotency, enforceRateLimit, mergeHeaders } from "@/lib/api/v1/security";
import { ApiError } from "@/lib/api/v1/errors";
import { joinGameSchema, parseJson } from "@/lib/api/v1/validation";
import { handleApiError, json, noContent, requestId, userClient } from "@/app/api/v1/_lib";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "join", user.id);
    const result = await withIdempotency(request, user.id, async () => {
      const input = parseJson(joinGameSchema, await request.clone().json());
      const { error } = await client.rpc("request_to_join_sport_event", {
        p_event_id: gameId, p_share_token: input.shareToken ?? null,
        p_requester_level: input.skillLevel, p_contact_method: input.contact.method,
        p_contact_value: input.contact.value,
      });
      if (error) {
        const m = error.message;
        if (/full/i.test(m)) throw new ApiError(409, "GAME_FULL", m);
        if (/private.*invite|invite.*private/i.test(m)) throw new ApiError(403, "PRIVATE_GAME_ACCESS_DENIED", m);
        if (/ended/i.test(m)) throw new ApiError(409, "GAME_ENDED", m);
        if (/cancelled/i.test(m)) throw new ApiError(409, "GAME_CANCELLED", m);
        if (/host cannot/i.test(m)) throw new ApiError(409, "HOST_CANNOT_JOIN", m);
        if (/not found/i.test(m)) throw new ApiError(404, "GAME_NOT_FOUND", m);
        throw new ApiError(409, "JOIN_NOT_ALLOWED", m);
      }
      const { data: game } = await client.from("sport_events").select("attendee_count,capacity").eq("id", gameId).maybeSingle();
      const { data: requestRow } = await client.from("event_join_requests").select("id,status").eq("event_id", gameId).eq("requester_id", user.id).maybeSingle();
      return {
        status: requestRow?.status === "approved" ? 200 : 201,
        body: { data: { gameId, status: requestRow?.status ?? "pending", requestId: requestRow?.id ?? null, spotsLeft: game ? Math.max(game.capacity - game.attendee_count, 0) : null } },
      };
    });
    return json(result.body, result.status, mergeHeaders(rate, new Headers({ "X-Idempotent-Replay": String(result.replayed) })));
  } catch (error) { return handleApiError(error, id); }
}

export async function DELETE(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "mutation", user.id);
    const participant = await client.from("event_participants").delete().eq("event_id", gameId).eq("profile_id", user.id);
    if (participant.error) throw new ApiError(409, "LEAVE_FAILED", "Could not leave the game.");
    const pending = await client.from("event_join_requests").delete().eq("event_id", gameId).eq("requester_id", user.id);
    if (pending.error) throw new ApiError(409, "LEAVE_FAILED", "Could not clear the join request.");
    return noContent(204, rate);
  } catch (error) { return handleApiError(error, id); }
}
