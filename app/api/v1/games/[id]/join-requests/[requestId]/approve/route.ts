import { enforceRateLimit, withIdempotency } from "@/lib/api/v1/security";
import { ApiError } from "@/lib/api/v1/errors";
import { handleApiError, noContent, requestId, userClient } from "@/app/api/v1/_lib";

type Context = { params: Promise<{ id: string; requestId: string }> };
export async function POST(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId, requestId: joinRequestId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "mutation", user.id);
    const result = await withIdempotency(request, user.id, async () => {
      const { data: game } = await client.from("sport_events").select("host_id").eq("id", gameId).maybeSingle();
      if (!game) throw new ApiError(404, "GAME_NOT_FOUND", "Game not found.");
      if (game.host_id !== user.id) throw new ApiError(403, "FORBIDDEN", "Only the host can approve requests.");
      const { data: req } = await client.from("event_join_requests").select("id").eq("id", joinRequestId).eq("event_id", gameId).maybeSingle();
      if (!req) throw new ApiError(404, "JOIN_REQUEST_NOT_FOUND", "Join request not found.");
      const { error } = await client.rpc("approve_join_request", { request_id: joinRequestId });
      if (error) {
        if (/full/i.test(error.message)) throw new ApiError(409, "GAME_FULL", error.message);
        throw new ApiError(409, "APPROVAL_FAILED", error.message);
      }
      return { status: 204, body: null };
    });
    return noContent(result.status, rate);
  } catch (error) { return handleApiError(error, id); }
}
